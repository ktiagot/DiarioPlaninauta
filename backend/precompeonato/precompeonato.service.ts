import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  EstatisticasFullResponseDto,
  MetagameDeckDto,
  MinhasEstatisticasDto,
  TopKillerDto,
} from './dto/estatisticas-response.dto';
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
      throw new BadRequestException('É necessário aceitar as regras do precompeonato.');
    }
    if (dto.aceitePrivacidade !== true) {
      throw new BadRequestException('É necessário aceitar a política de privacidade.');
    }
    if (dto.entrouDiscord !== true) {
      throw new BadRequestException(
        'É necessário confirmar que você entrou no Discord do Diário Planinauta.',
      );
    }

    const emailNormalized = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: emailNormalized, mode: 'insensitive' } },
    });

    if (!user) {
      throw new NotFoundException('Usuário não cadastrado no portal.');
    }

    if ((user.monthlyContribution ?? 0) < 15) {
      throw new ForbiddenException(
        'O tier mínimo para participar do Precompeonato é R$15/mês no APOIA.se.',
      );
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

    const deckNome = dto.deckNome.trim();
    const aceiteTermosEm = new Date();

    const inscricao = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inscricao.create({
        data: {
          campeonatoId: campeonato.id,
          userId: user.id,
          email: user.email,
          discordNick: dto.discordNick.trim(),
          deckNome,
          comandante: dto.comandante.trim(),
          aceiteTermos: true,
          aceiteTermosEm,
          aceitePrivacidade: true,
          entrouDiscord: true,
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

  async getEstatisticas(userId?: string): Promise<EstatisticasFullResponseDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    const [gerais, metagame, topKillers] = await Promise.all([
      this.buildEstatisticasGerais(campeonato.id),
      this.buildMetagame(campeonato.id),
      this.buildTopKillers(campeonato.id),
    ]);

    const minhas = userId
      ? await this.buildMinhasEstatisticas(campeonato.id, userId)
      : null;

    return { gerais, metagame, topKillers, ...(minhas ? { minhas } : {}) };
  }

  private async buildEstatisticasGerais(campeonatoId: string) {
    const [totalPartidas, totalJogadores, totalRodadas, decksDistintos] =
      await Promise.all([
        this.prisma.mesaTorneio.count({
          where: {
            finalizada: true,
            rodada: { campeonatoId },
          },
        }),
        this.prisma.inscricao.count({
          where: { campeonatoId, ativo: true },
        }),
        this.prisma.rodada.count({
          where: { campeonatoId },
        }),
        this.prisma.inscricao.findMany({
          where: { campeonatoId, ativo: true },
          select: { deckNome: true },
          distinct: ['deckNome'],
        }),
      ]);

    return {
      totalPartidas,
      totalJogadores,
      totalRodadas,
      totalDecks: decksDistintos.length,
    };
  }

  private async buildMetagame(campeonatoId: string): Promise<MetagameDeckDto[]> {
    const inscricoes = await this.prisma.inscricao.findMany({
      where: { campeonatoId, ativo: true },
      select: {
        id: true,
        deckNome: true,
        comandante: true,
        mesas: {
          where: { mesa: { finalizada: true } },
          select: { posicaoFinal: true },
        },
      },
    });

    const deckMap = new Map<
      string,
      { deckNome: string; comandante: string; vezesUsado: number; vitorias: number; partidas: number }
    >();

    for (const inscricao of inscricoes) {
      const key = inscricao.deckNome.toLowerCase().trim();
      const existing = deckMap.get(key);

      const partidasJogadas = inscricao.mesas.length;
      const vitoriasCount = inscricao.mesas.filter((m) => m.posicaoFinal === 1).length;

      if (existing) {
        existing.vezesUsado += 1;
        existing.partidas += partidasJogadas;
        existing.vitorias += vitoriasCount;
      } else {
        deckMap.set(key, {
          deckNome: inscricao.deckNome,
          comandante: inscricao.comandante,
          vezesUsado: 1,
          partidas: partidasJogadas,
          vitorias: vitoriasCount,
        });
      }
    }

    return Array.from(deckMap.values())
      .map((d) => ({
        deckNome: d.deckNome,
        comandante: d.comandante,
        vezesUsado: d.vezesUsado,
        vitorias: d.vitorias,
        winRate: d.partidas > 0 ? Math.round((d.vitorias / d.partidas) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.vezesUsado - a.vezesUsado);
  }

  private async buildTopKillers(campeonatoId: string): Promise<TopKillerDto[]> {
    const jogadores = await this.prisma.mesaTorneioJogador.findMany({
      where: {
        mesa: { rodada: { campeonatoId }, finalizada: true },
        kills: { gt: 0 },
      },
      select: {
        kills: true,
        inscricao: {
          select: {
            user: { select: { nick: true } },
          },
        },
      },
    });

    const killsMap = new Map<string, number>();
    for (const j of jogadores) {
      const nick = j.inscricao.user.nick;
      killsMap.set(nick, (killsMap.get(nick) ?? 0) + j.kills);
    }

    return Array.from(killsMap.entries())
      .map(([nick, totalKills]) => ({ nick, totalKills }))
      .sort((a, b) => b.totalKills - a.totalKills)
      .slice(0, 5);
  }

  private async buildMinhasEstatisticas(
    campeonatoId: string,
    userId: string,
  ): Promise<MinhasEstatisticasDto | null> {
    const inscricao = await this.prisma.inscricao.findFirst({
      where: { campeonatoId, userId, ativo: true },
      select: {
        id: true,
        deckNome: true,
        mesas: {
          where: { mesa: { finalizada: true } },
          select: { posicaoFinal: true, kills: true },
        },
      },
    });

    if (!inscricao) return null;

    const partidas = inscricao.mesas.length;
    const vitorias = inscricao.mesas.filter((m) => m.posicaoFinal === 1).length;
    const kills = inscricao.mesas.reduce((sum, m) => sum + m.kills, 0);
    const winRate = partidas > 0 ? Math.round((vitorias / partidas) * 100 * 10) / 10 : 0;

    // Buscar todas as inscrições do usuário neste campeonato (em caso de reinscrição com deck diferente)
    const todasInscricoes = await this.prisma.inscricao.findMany({
      where: { campeonatoId, userId },
      select: {
        deckNome: true,
        mesas: {
          where: { mesa: { finalizada: true } },
          select: { posicaoFinal: true },
        },
      },
    });

    const deckStats = new Map<string, { partidas: number; vitorias: number }>();
    for (const insc of todasInscricoes) {
      const key = insc.deckNome;
      const existing = deckStats.get(key) ?? { partidas: 0, vitorias: 0 };
      existing.partidas += insc.mesas.length;
      existing.vitorias += insc.mesas.filter((m) => m.posicaoFinal === 1).length;
      deckStats.set(key, existing);
    }

    const decksMaisUsados = Array.from(deckStats.entries())
      .map(([deckNome, stats]) => ({
        deckNome,
        partidas: stats.partidas,
        vitorias: stats.vitorias,
      }))
      .sort((a, b) => b.partidas - a.partidas);

    return { partidas, vitorias, kills, winRate, decksMaisUsados };
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
