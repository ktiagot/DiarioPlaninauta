import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campeonato, CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from '../precons/precons.service';
import {
  inscricaoPreconInclude,
  inscricaoWithPreconInclude,
} from '../precons/mappers/to-precon-response';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { CampeonatoAtualResponseDto } from './dto/campeonato-atual-response.dto';
import { InscricaoResponseDto } from './dto/inscricao-response.dto';
import { JogadorPrecompeonatoResponseDto } from './dto/jogador-precompeonato-response.dto';
import { InscritoAdminResponseDto } from './dto/inscrito-admin-response.dto';
import {
  EstatisticasFullResponseDto,
  MetagameDeckDto,
  MinhasEstatisticasDto,
  TopKillerDto,
} from './dto/estatisticas-response.dto';
import { MinhasMesasResponseDto, MinhasMesaDto } from './dto/minhas-mesas-response.dto';
import { DashboardMetricasResponseDto } from './dto/dashboard-metricas.dto';
import {
  toCampeonatoAtualResponse,
  toInscricaoResponse,
  toInscricaoResumo,
  toInscritoAdminResponse,
  toJogadorResponse,
  sortInscritosAdmin,
} from './mappers/to-precompeonato-response';

/** Mesa encerrada = todos os jogadores têm posicaoFinal (coluna finalizada foi dropada). */
const mesaTorneioFinalizadaWhere = {
  jogadores: {
    some: {},
    every: { posicaoFinal: { not: null } },
  },
};

function isMesaTorneioFinalizada(mesa: {
  jogadores: { posicaoFinal: number | null }[];
}): boolean {
  return (
    mesa.jogadores.length > 0 &&
    mesa.jogadores.every((j) => j.posicaoFinal != null)
  );
}

@Injectable()
export class PrecompeonatoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preconsService: PreconsService,
  ) {}

  async getAtual(email?: string): Promise<CampeonatoAtualResponseDto> {
    // Público: rascunhos não aparecem até serem publicados.
    const campeonato = await this.prisma.campeonato.findFirst({
      where: { status: { not: CampeonatoStatus.RASCUNHO } },
      orderBy: { createdAt: 'desc' },
    });

    if (!campeonato) {
      throw new NotFoundException('Nenhum precompeonato encontrado.');
    }

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
      include: inscricaoPreconInclude,
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

    await this.preconsService.validateForInscricao(
      dto.preconId,
      dto.preconComandanteId,
      dto.preconComandante2Id,
    );
    const aceiteTermosEm = new Date();

    const inscricao = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inscricao.create({
        data: {
          campeonatoId: campeonato.id,
          userId: user.id,
          email: user.email,
          discordNick: dto.discordNick.trim(),
          preconId: dto.preconId,
          preconComandanteId: dto.preconComandanteId,
          preconComandante2Id: dto.preconComandante2Id ?? null,
          aceiteTermos: true,
          aceiteTermosEm,
          aceitePrivacidade: true,
          entrouDiscord: true,
        },
        include: {
          ...inscricaoWithPreconInclude,
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
        ...inscricaoWithPreconInclude,
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

  async listInscritosAdmin(): Promise<InscritoAdminResponseDto[]> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    const inscricoes = await this.prisma.inscricao.findMany({
      where: { campeonatoId: campeonato.id },
      include: {
        ...inscricaoWithPreconInclude,
        mesas: {
          where: { mesa: mesaTorneioFinalizadaWhere },
          select: { posicaoFinal: true },
        },
      },
    });

    const inscritos = inscricoes.map(toInscritoAdminResponse);
    return sortInscritosAdmin(inscritos);
  }

  async setInscricaoAtivo(
    inscricaoId: string,
    ativo: boolean,
  ): Promise<InscritoAdminResponseDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    if (campeonato.status === CampeonatoStatus.ENCERRADO) {
      throw new ConflictException(
        'Não é possível alterar inscrições de um campeonato encerrado.',
      );
    }

    const inscricao = await this.prisma.inscricao.findFirst({
      where: { id: inscricaoId, campeonatoId: campeonato.id },
      include: {
        ...inscricaoWithPreconInclude,
        mesas: {
          where: { mesa: mesaTorneioFinalizadaWhere },
          select: { posicaoFinal: true },
        },
      },
    });

    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    if (inscricao.ativo === ativo) {
      return toInscritoAdminResponse(inscricao);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inscricao.update({
        where: { id: inscricao.id },
        data: { ativo },
      });

      if (!ativo) {
        await this.removeCheckInsPendentes(tx, campeonato.id, inscricao.id);
      }
    });

    const updated = await this.prisma.inscricao.findUniqueOrThrow({
      where: { id: inscricao.id },
      include: {
        ...inscricaoWithPreconInclude,
        mesas: {
          where: { mesa: mesaTorneioFinalizadaWhere },
          select: { posicaoFinal: true },
        },
      },
    });

    return toInscritoAdminResponse(updated);
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
            ...mesaTorneioFinalizadaWhere,
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
          select: { preconId: true },
          distinct: ['preconId'],
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
        preconId: true,
        precon: { select: { nome: true } },
        preconComandante: { select: { comandante: true } },
        mesas: {
          where: { mesa: mesaTorneioFinalizadaWhere },
          select: { posicaoFinal: true },
        },
      },
    });

    const deckMap = new Map<
      string,
      { deckNome: string; comandante: string; vezesUsado: number; vitorias: number; partidas: number }
    >();

    for (const inscricao of inscricoes) {
      const key = inscricao.preconId;
      const deckNome = inscricao.precon.nome;
      const comandante = inscricao.preconComandante.comandante;
      const existing = deckMap.get(key);

      const partidasJogadas = inscricao.mesas.length;
      const vitoriasCount = inscricao.mesas.filter((m) => m.posicaoFinal === 1).length;

      if (existing) {
        existing.vezesUsado += 1;
        existing.partidas += partidasJogadas;
        existing.vitorias += vitoriasCount;
      } else {
        deckMap.set(key, {
          deckNome,
          comandante,
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
        mesa: { rodada: { campeonatoId }, ...mesaTorneioFinalizadaWhere },
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
        precon: { select: { nome: true } },
        mesas: {
          where: { mesa: mesaTorneioFinalizadaWhere },
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
        precon: { select: { nome: true } },
        mesas: {
          where: { mesa: mesaTorneioFinalizadaWhere },
          select: { posicaoFinal: true },
        },
      },
    });

    const deckStats = new Map<string, { partidas: number; vitorias: number }>();
    for (const insc of todasInscricoes) {
      const key = insc.precon.nome;
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

  async getDashboardMetricas(): Promise<DashboardMetricasResponseDto> {
    const [
      totalUsuarios,
      apoiadoresAtivos,
      exApoiadores,
      campeonatosRealizados,
      totalRodadas,
      totalPartidas,
      totalMesasCasuais,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isApoiadorAtivo: true } }),
      this.prisma.user.count({ where: { isExApoiador: true } }),
      this.prisma.campeonato.count(),
      this.prisma.rodada.count(),
      this.prisma.mesaTorneio.count({ where: mesaTorneioFinalizadaWhere }),
      this.prisma.mesa.count(),
    ]);

    // Evolução por rodada (campeonato atual)
    const campeonato = await this.prisma.campeonato.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let evolucaoRodadas: { label: string; jogadores: number; mesas: number }[] = [];
    let metagameDistribuicao: { comandante: string; quantidade: number }[] = [];
    let topKillsPorRodada: { label: string; kills: number }[] = [];

    if (campeonato) {
      const rodadas = await this.prisma.rodada.findMany({
        where: { campeonatoId: campeonato.id },
        orderBy: { numero: 'asc' },
        include: {
          mesas: {
            where: mesaTorneioFinalizadaWhere,
            include: {
              jogadores: { select: { kills: true } },
            },
          },
        },
      });

      evolucaoRodadas = rodadas.map((r) => ({
        label: `Rodada ${r.numero}`,
        jogadores: r.mesas.reduce((sum, m) => sum + m.jogadores.length, 0),
        mesas: r.mesas.length,
      }));

      topKillsPorRodada = rodadas.map((r) => ({
        label: `Rodada ${r.numero}`,
        kills: r.mesas.reduce(
          (sum, m) => sum + m.jogadores.reduce((s, j) => s + j.kills, 0),
          0,
        ),
      }));

      // Metagame distribuição
      const inscricoes = await this.prisma.inscricao.findMany({
        where: { campeonatoId: campeonato.id, ativo: true },
        select: {
          preconComandante: { select: { comandante: true } },
        },
      });

      const cmdMap = new Map<string, number>();
      for (const i of inscricoes) {
        const cmd = i.preconComandante.comandante.trim();
        cmdMap.set(cmd, (cmdMap.get(cmd) ?? 0) + 1);
      }

      metagameDistribuicao = Array.from(cmdMap.entries())
        .map(([comandante, quantidade]) => ({ comandante, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);
    }

    return {
      gerais: {
        totalUsuarios,
        apoiadoresAtivos,
        exApoiadores,
        campeonatosRealizados,
        totalRodadas,
        totalPartidas,
        totalMesasCasuais,
      },
      evolucaoRodadas,
      metagameDistribuicao,
      topKillsPorRodada,
    };
  }

  async getMinhasMesas(userId: string): Promise<MinhasMesasResponseDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    const inscricao = await this.prisma.inscricao.findFirst({
      where: {
        campeonatoId: campeonato.id,
        userId,
        ativo: true,
      },
      select: { id: true },
    });

    if (!inscricao) {
      return { mesas: [] };
    }

    const mesasJogador = await this.prisma.mesaTorneioJogador.findMany({
      where: { inscricaoId: inscricao.id },
      include: {
        mesa: {
          include: {
            rodada: { select: { numero: true } },
            jogadores: {
              include: {
                inscricao: {
                  include: {
                    user: { select: { nick: true } },
                    precon: { select: { nome: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { mesa: { rodada: { numero: 'asc' } } },
    });

    const mesas: MinhasMesaDto[] = mesasJogador.map((mj) => ({
      id: mj.mesa.id,
      rodadaNumero: mj.mesa.rodada.numero,
      numeroMesa: mj.mesa.numeroMesa,
      finalizada: isMesaTorneioFinalizada(mj.mesa),
      minhaPosicaoFinal: mj.posicaoFinal,
      jogadores: mj.mesa.jogadores.map((j) => ({
        nick: j.inscricao.user.nick,
        deckNome: j.inscricao.precon.nome,
        posicaoFinal: j.posicaoFinal,
      })),
    }));

    return { mesas };
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

  /** Rodada aberta para check-in (sem mesas sorteadas). */
  private async findRodadaCheckIn(campeonatoId: string) {
    const rodadas = await this.prisma.rodada.findMany({
      where: { campeonatoId, finalizada: false },
      orderBy: { numero: 'asc' },
      include: { _count: { select: { mesas: true } } },
    });
    return rodadas.find((r) => r._count.mesas === 0) ?? null;
  }

  private async removeCheckInsPendentes(
    tx: Pick<PrismaService, 'checkInRodada'>,
    campeonatoId: string,
    inscricaoId: string,
  ): Promise<void> {
    const rodada = await this.findRodadaCheckIn(campeonatoId);
    if (!rodada) return;

    await tx.checkInRodada.deleteMany({
      where: { rodadaId: rodada.id, inscricaoId },
    });
  }
}
