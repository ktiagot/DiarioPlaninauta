import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campeonato, CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { CampeonatoAtualResponseDto } from './dto/campeonato-atual-response.dto';
import { InscricaoResponseDto } from './dto/inscricao-response.dto';
import { JogadorPrecompeonatoResponseDto } from './dto/jogador-precompeonato-response.dto';
import {
  toCampeonatoAtualResponse,
  toInscricaoResponse,
  toInscricaoResumo,
  toJogadorResponse,
} from './mappers/to-precompeonato-response';

@Injectable()
export class PrecompeonatoService {
  constructor(private readonly prisma: PrismaService) {}

  async getAtual(email?: string): Promise<CampeonatoAtualResponseDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    if (!email) {
      return toCampeonatoAtualResponse(campeonato);
    }

    const emailNormalized = email.trim().toLowerCase();
    const inscricao = await this.prisma.inscricao.findFirst({
      where: {
        campeonatoId: campeonato.id,
        email: { equals: emailNormalized, mode: 'insensitive' },
        ativo: true,
      },
    });

    return toCampeonatoAtualResponse(campeonato, {
      jaInscrito: !!inscricao,
      inscricao: inscricao ? toInscricaoResumo(inscricao) : null,
    });
  }

  async createInscricao(dto: CreateInscricaoDto): Promise<InscricaoResponseDto> {
    if (dto.aceiteTermos !== true) {
      throw new BadRequestException('É necessário aceitar os termos de uso.');
    }

    const emailNormalized = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: emailNormalized, mode: 'insensitive' } },
    });

    if (!user) {
      throw new NotFoundException('Usuário não cadastrado no portal.');
    }

    const campeonato = await this.findCampeonatoAtualOrThrow();

    if (campeonato.status !== CampeonatoStatus.INSCRICOES_ABERTAS) {
      throw new ConflictException(
        'As inscrições para o precompeonato atual não estão abertas.',
      );
    }

    const existente = await this.prisma.inscricao.findUnique({
      where: {
        campeonatoId_userId: {
          campeonatoId: campeonato.id,
          userId: user.id,
        },
      },
    });

    if (existente) {
      throw new ConflictException('Você já está inscrito neste precompeonato.');
    }

    const deckNome = dto.deckNome?.trim() || dto.comandante.trim();
    const aceiteTermosEm = new Date();

    const inscricao = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inscricao.create({
        data: {
          campeonatoId: campeonato.id,
          userId: user.id,
          email: user.email,
          deckUrl: dto.deckUrl,
          deckNome,
          comandante: dto.comandante.trim(),
          aceiteTermos: true,
          aceiteTermosEm,
        },
        include: {
          user: { select: { nome: true, nick: true } },
        },
      });

      if (!user.preCampeonatos.includes(campeonato.nome)) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            preCampeonatos: [...user.preCampeonatos, campeonato.nome],
          },
        });
      }

      return created;
    });

    return toInscricaoResponse(inscricao);
  }

  async listJogadores(): Promise<JogadorPrecompeonatoResponseDto[]> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    const inscricoes = await this.prisma.inscricao.findMany({
      where: {
        campeonatoId: campeonato.id,
        ativo: true,
      },
      include: {
        user: { select: { nome: true, nick: true } },
        mesas: {
          include: {
            mesa: {
              include: {
                rodada: { select: { numero: true } },
              },
            },
          },
        },
      },
      orderBy: [{ posicao: 'asc' }, { pontos: 'desc' }],
    });

    // Prisma puts nulls first on ASC by default in PostgreSQL; re-sort nulls last.
    const jogadores = inscricoes.map(toJogadorResponse);
    return jogadores.sort((a, b) => {
      if (a.posicao == null && b.posicao == null) {
        return b.pontos - a.pontos;
      }
      if (a.posicao == null) return 1;
      if (b.posicao == null) return -1;
      if (a.posicao !== b.posicao) return a.posicao - b.posicao;
      return b.pontos - a.pontos;
    });
  }

  private async findCampeonatoAtualOrThrow(): Promise<Campeonato> {
    const campeonato = await this.prisma.campeonato.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!campeonato) {
      throw new NotFoundException('Nenhum precompeonato encontrado.');
    }

    return campeonato;
  }
}
