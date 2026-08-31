import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { JogadorAdminResponseDto } from './dto/jogador-admin-response.dto';
import { JogadorComunidadeResponseDto } from './dto/jogador-comunidade-response.dto';
import { ContatoResponseDto } from './dto/contato-response.dto';
import { VerificarApoiaResponseDto } from './dto/verificar-apoia-response.dto';

@Injectable()
export class ComunidadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apoiaseService: ApoiaSeService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async listarJogadores(filtros: {
    busca?: string;
    cidade?: string;
    formato?: string;
    disponibilidade?: string;
  }): Promise<JogadorComunidadeResponseDto[]> {
    const where: Record<string, unknown> = {
      isApoiadorAtivo: true,
    };

    if (filtros.busca) {
      const termo = filtros.busca.trim();
      where.OR = [
        { nick: { contains: termo, mode: 'insensitive' } },
        { nome: { contains: termo, mode: 'insensitive' } },
        { cidade: { contains: termo, mode: 'insensitive' } },
      ];
    }

    if (filtros.cidade) {
      where.cidade = { equals: filtros.cidade, mode: 'insensitive' };
    }

    if (filtros.formato) {
      where.formatos = { has: filtros.formato };
    }

    if (filtros.disponibilidade) {
      where.diasDisponiveis = { has: filtros.disponibilidade };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        nick: true,
        nome: true,
        cidade: true,
        estado: true,
        formatos: true,
        diasDisponiveis: true,
        horarios: true,
        foto: true,
        apoiandoDesde: true,
      },
      orderBy: { nick: 'asc' },
    });

    return users;
  }

  async obterContato(
    solicitanteUserId: string,
    alvoUserId: string,
  ): Promise<ContatoResponseDto> {
    // Verifica se o alvo existe
    const alvo = await this.prisma.user.findUnique({
      where: { id: alvoUserId },
      select: {
        id: true,
        telefone: true,
        nick: true,
        visibilidadeTelefone: true,
      },
    });

    if (!alvo) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Verifica favorito mútuo: solicitante favoritou alvo E alvo favoritou solicitante
    const [favoritouAlvo, alvoFavoritou] = await Promise.all([
      this.prisma.favorito.findUnique({
        where: {
          deUserId_paraUserId: {
            deUserId: solicitanteUserId,
            paraUserId: alvoUserId,
          },
        },
      }),
      this.prisma.favorito.findUnique({
        where: {
          deUserId_paraUserId: {
            deUserId: alvoUserId,
            paraUserId: solicitanteUserId,
          },
        },
      }),
    ]);

    const mutuo = !!favoritouAlvo && !!alvoFavoritou;

    if (!mutuo) {
      return { mutuo: false };
    }

    return {
      mutuo: true,
      // Telefone privado não é exposto nem para favoritos mútuos.
      telefone: alvo.visibilidadeTelefone === 'PRIVADO' ? null : alvo.telefone,
      // O nick do portal é o nick do Discord.
      discord: alvo.nick,
    };
  }

  async listarFavoritos(userId: string): Promise<string[]> {
    const favoritos = await this.prisma.favorito.findMany({
      where: { deUserId: userId },
      select: { paraUserId: true },
    });

    return favoritos.map((f) => f.paraUserId);
  }

  async favoritar(deUserId: string, paraUserId: string): Promise<void> {
    // Não pode favoritar a si mesmo
    if (deUserId === paraUserId) {
      return;
    }

    // Verifica se o usuário alvo existe
    const alvo = await this.prisma.user.findUnique({
      where: { id: paraUserId },
      select: { id: true, nick: true },
    });

    if (!alvo) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Se já era favorito, não refaz nada (evita notificar de novo).
    const jaFavoritava = await this.prisma.favorito.findUnique({
      where: { deUserId_paraUserId: { deUserId, paraUserId } },
    });
    if (jaFavoritava) return;

    await this.prisma.favorito.create({
      data: { deUserId, paraUserId },
    });

    // Detecta reciprocidade: o alvo já favoritava o solicitante?
    const alvoFavoritou = await this.prisma.favorito.findUnique({
      where: {
        deUserId_paraUserId: { deUserId: paraUserId, paraUserId: deUserId },
      },
    });

    if (alvoFavoritou) {
      await this.notificarFavoritoMutuo(deUserId, alvo.nick, paraUserId);
    }
  }

  /** Notifica ambos os usuários que o favorito virou mútuo (contato liberado). */
  private async notificarFavoritoMutuo(
    solicitanteId: string,
    alvoNick: string,
    alvoId: string,
  ): Promise<void> {
    const solicitante = await this.prisma.user.findUnique({
      where: { id: solicitanteId },
      select: { nick: true },
    });
    const solicitanteNick = solicitante?.nick ?? 'Alguém';

    await this.prisma.notificacao.createMany({
      data: [
        {
          userId: solicitanteId,
          tipo: 'favorito_mutuo',
          titulo: 'Novo contato liberado',
          mensagem: `Você e ${alvoNick} se favoritaram. O contato foi liberado!`,
        },
        {
          userId: alvoId,
          tipo: 'favorito_mutuo',
          titulo: 'Novo contato liberado',
          mensagem: `Você e ${solicitanteNick} se favoritaram. O contato foi liberado!`,
        },
      ],
    });
  }

  async desfavoritar(deUserId: string, paraUserId: string): Promise<void> {
    await this.prisma.favorito.deleteMany({
      where: { deUserId, paraUserId },
    });
  }

  async listAdminJogadores(): Promise<JogadorAdminResponseDto[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        nick: true,
        isApoiadorAtivo: true,
        isExApoiador: true,
        lastValidationAt: true,
        monthlyContribution: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async verificarESincronizar(email: string): Promise<VerificarApoiaResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, apoiandoDesde: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    let backer;
    try {
      backer = await this.apoiaseService.verify(email);
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        return {
          email,
          ativo: false,
          isBacker: false,
          isPaidThisMonth: false,
          thisMonthPaidValue: null,
          apiIndisponivel: true,
        };
      }
      throw err;
    }

    const ativo = backer.isBacker && backer.isPaidThisMonth;

    const updateData: Record<string, unknown> = {
      isApoiadorAtivo: ativo,
      isExApoiador: !backer.isBacker,
      lastValidationAt: new Date(),
      monthlyContribution: backer.thisMonthPaidValue ?? null,
    };

    if (ativo && !user.apoiandoDesde) {
      updateData.apoiandoDesde = new Date();
    }

    await this.prisma.user.update({
      where: { email },
      data: updateData,
    });

    return {
      email,
      ativo,
      isBacker: backer.isBacker,
      isPaidThisMonth: backer.isPaidThisMonth,
      thisMonthPaidValue: backer.thisMonthPaidValue ?? null,
      apiIndisponivel: false,
    };
  }

  /**
   * Revalida no APOIA.se o status de apoio de todos os usuários e sincroniza o banco.
   * Processa em sequência com um pequeno intervalo para não sobrecarregar a API.
   * Resiliente: erros por usuário não interrompem o lote. Retorna um resumo.
   */
  async sincronizarTodosApoiadores(): Promise<{
    total: number;
    ativos: number;
    inativados: number;
    falhas: number;
  }> {
    const users = await this.prisma.user.findMany({ select: { email: true } });

    let ativos = 0;
    let inativados = 0;
    let falhas = 0;

    for (const { email } of users) {
      try {
        const resultado = await this.verificarESincronizar(email);
        if (resultado.apiIndisponivel) {
          falhas++;
        } else if (resultado.ativo) {
          ativos++;
        } else {
          inativados++;
        }
      } catch {
        falhas++;
      }

      // Intervalo curto entre chamadas para respeitar a API do APOIA.se.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return { total: users.length, ativos, inativados, falhas };
  }

  async getMetricas() {
    const [totalMembros, apoiadoresAtivos, exApoiadores, totalFavoritos] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isApoiadorAtivo: true } }),
        this.prisma.user.count({ where: { isExApoiador: true } }),
        this.prisma.favorito.count(),
      ]);

    // Top cidades
    const users = await this.prisma.user.findMany({
      where: { isApoiadorAtivo: true },
      select: { cidade: true, formatos: true },
    });

    const cidadeMap = new Map<string, number>();
    const formatoMap = new Map<string, number>();

    for (const u of users) {
      if (u.cidade) {
        const c = u.cidade.trim();
        cidadeMap.set(c, (cidadeMap.get(c) ?? 0) + 1);
      }
      for (const f of u.formatos) {
        formatoMap.set(f, (formatoMap.get(f) ?? 0) + 1);
      }
    }

    const topCidades = Array.from(cidadeMap.entries())
      .map(([cidade, quantidade]) => ({ cidade, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    const topFormatos = Array.from(formatoMap.entries())
      .map(([formato, quantidade]) => ({ formato, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    return {
      totalMembros,
      apoiadoresAtivos,
      exApoiadores,
      totalFavoritos,
      topCidades,
      topFormatos,
    };
  }
}
