import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JogadorComunidadeResponseDto } from './dto/jogador-comunidade-response.dto';
import { ContatoResponseDto } from './dto/contato-response.dto';

@Injectable()
export class ComunidadeService {
  constructor(private readonly prisma: PrismaService) {}

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
      select: { id: true, telefone: true },
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
      telefone: alvo.telefone,
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
      select: { id: true },
    });

    if (!alvo) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.prisma.favorito.upsert({
      where: {
        deUserId_paraUserId: {
          deUserId,
          paraUserId,
        },
      },
      create: { deUserId, paraUserId },
      update: {},
    });
  }

  async desfavoritar(deUserId: string, paraUserId: string): Promise<void> {
    await this.prisma.favorito.deleteMany({
      where: { deUserId, paraUserId },
    });
  }
}
