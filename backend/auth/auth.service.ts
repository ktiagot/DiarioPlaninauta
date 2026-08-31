import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';

// Hash fictício para rodar argon2.verify mesmo quando o usuário não existe,
// evitando timing attack por diferença de tempo de resposta.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaasfEfp8XVWrvO-N8';

@Injectable()
export class AuthService {
  constructor(
    private readonly apoiaseService: ApoiaSeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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

  async requestLogin(email: string) {
    const backer = await this.apoiaseService.verify(email);

    if (!backer.isBacker) {
      // Se o usuário existe no banco, marcar como ex-apoiador
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.isApoiadorAtivo) {
        await this.prisma.user.update({
          where: { email },
          data: { isApoiadorAtivo: false, isExApoiador: true },
        });
      }

      throw new UnauthorizedException(
        'Você precisa ser apoiador ativo no APOIA.se para acessar o portal.',
      );
    }

    if (!backer.isPaidThisMonth) {
      throw new UnauthorizedException(
        'Seu apoio deste mês ainda não foi processado. Tente novamente em breve.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException(
        'Nenhuma conta encontrada com este e-mail. Faça o cadastro completo antes de entrar.',
      );
    }

    // Reativar caso tenha voltado a apoiar
    const updateData: Record<string, unknown> = {
      monthlyContribution: backer.thisMonthPaidValue ?? null,
      isApoiadorAtivo: true,
      isExApoiador: false,
      lastValidationAt: new Date(),
    };

    if (!user.apoiandoDesde) {
      updateData.apoiandoDesde = new Date();
    }

    const updated = await this.prisma.user.update({
      where: { email },
      data: updateData,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
    });

    return {
      accessToken,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        monthlyContribution: updated.monthlyContribution,
        isAdmin: updated.isAdmin,
        nome: updated.nome,
        nick: updated.nick,
      },
    };
  }
}
