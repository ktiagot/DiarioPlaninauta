import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import * as argon2 from 'argon2';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail/mail.service';

// Hash fictício para rodar argon2.verify mesmo quando o usuário não existe,
// evitando timing attack por diferença de tempo de resposta.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaasfEfp8XVWrvO-N8';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly apoiaseService: ApoiaSeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async verifyBacker(email: string) {
    const backer = await this.apoiaseService.verify(email);
    return {
      isBacker: backer.isBacker,
      isPaidThisMonth: backer.isPaidThisMonth,
      thisMonthPaidValue: backer.thisMonthPaidValue ?? null,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    const hashToVerify = user?.passwordHash ?? DUMMY_HASH;
    const valid = await argon2.verify(hashToVerify, password);

    if (!user || !user.passwordHash || !valid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        monthlyContribution: user.monthlyContribution,
        isAdmin: user.isAdmin,
        nome: user.nome,
        nick: user.nick,
      },
    };
  }

  async changePassword(
    userId: string,
    senhaAtual: string,
    novaSenha: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const atualValida = await argon2.verify(user.passwordHash, senhaAtual);
    if (!atualValida) {
      throw new UnauthorizedException('A senha atual está incorreta.');
    }

    const igual = await argon2.verify(user.passwordHash, novaSenha);
    if (igual) {
      throw new BadRequestException('A nova senha deve ser diferente da atual.');
    }

    const novoHash = await argon2.hash(novaSenha);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: novoHash },
    });
  }

  /**
   * Inicia a redefinição de senha: gera um código de 6 dígitos, guarda o HASH
   * dele com validade de 15 min e envia o código por e-mail. Resposta sempre
   * genérica (não revela se o e-mail existe) para evitar enumeração de contas.
   */
  async esqueciSenha(email: string): Promise<void> {
    const normalizado = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizado },
    });

    if (!user) return; // resposta genérica: não sinaliza inexistência

    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const resetSenhaHash = await argon2.hash(codigo);
    const resetSenhaExpiraEm = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetSenhaHash, resetSenhaExpiraEm },
    });

    try {
      await this.mailService.sendResetSenhaCode(user.email, codigo);
    } catch (err) {
      this.logger.error('Falha ao enviar e-mail de redefinição de senha.', err as Error);
    }
  }

  /** Conclui a redefinição validando o código e gravando a nova senha. */
  async resetSenha(email: string, codigo: string, novaSenha: string): Promise<void> {
    const normalizado = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizado },
    });

    const invalido = new BadRequestException('Código inválido ou expirado.');

    if (!user || !user.resetSenhaHash || !user.resetSenhaExpiraEm) {
      throw invalido;
    }
    if (user.resetSenhaExpiraEm.getTime() < Date.now()) {
      throw invalido;
    }

    const codigoOk = await argon2.verify(user.resetSenhaHash, codigo);
    if (!codigoOk) {
      throw invalido;
    }

    const novoHash = await argon2.hash(novaSenha);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: novoHash,
        resetSenhaHash: null,
        resetSenhaExpiraEm: null,
      },
    });
  }

  async requestLogin(email: string) {
    const backer = await this.apoiaseService.verify(email);
    const apoiadorOk = backer.isBacker && backer.isPaidThisMonth;

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Acesso liberado para apoiador ativo e pago OU membro do YouTube (validado
    // por import de CSV no admin). Mantém a flag de apoiador sincronizada.
    const ehMembroYoutube = !!user?.isMembroYoutube;

    if (!apoiadorOk && !ehMembroYoutube) {
      // Não é apoiador e não é membro YT: mantém flags de apoiador coerentes.
      if (user && !backer.isBacker && user.isApoiadorAtivo) {
        await this.prisma.user.update({
          where: { email },
          data: { isApoiadorAtivo: false, isExApoiador: true },
        });
      }

      if (!backer.isBacker) {
        throw new UnauthorizedException(
          'Você precisa ser apoiador ativo no APOIA.se ou membro do canal no YouTube para acessar o portal.',
        );
      }
      throw new UnauthorizedException(
        'Seu apoio deste mês ainda não foi processado. Tente novamente em breve.',
      );
    }

    if (!user) {
      throw new UnauthorizedException(
        'Nenhuma conta encontrada com este e-mail. Faça o cadastro completo antes de entrar.',
      );
    }

    // Sincroniza as flags de apoiador conforme o resultado do APOIA.se. O acesso
    // de membro YT não depende disso; só reflete o estado real do apoio.
    const updateData: Prisma.UserUpdateInput = {
      monthlyContribution: backer.thisMonthPaidValue ?? null,
      isApoiadorAtivo: apoiadorOk,
      isExApoiador: !backer.isBacker,
      lastValidationAt: new Date(),
    };

    if (apoiadorOk && !user.apoiandoDesde) {
      updateData.apoiandoDesde = new Date();
    }

    const updated = await this.prisma.user.update({
      where: { email },
      data: updateData,
    });

    return this.buildLoginResponse(updated);
  }

  private async buildLoginResponse(user: {
    id: string;
    email: string;
    role: string;
    monthlyContribution: number | null;
    isAdmin: boolean;
    nome: string;
    nick: string;
  }) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        monthlyContribution: user.monthlyContribution,
        isAdmin: user.isAdmin,
        nome: user.nome,
        nick: user.nick,
      },
    };
  }
}
