import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campeonato, CampeonatoStatus, Prisma, Rodada } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRodadaDto } from '../dto/create-rodada.dto';
import {
  AbrirRodadaContextDto,
  RodadaListItemDto,
  RodadasListResponseDto,
} from '../dto/rodadas-list.dto';
import {
  CheckInStatusDto,
  SorteioMesaDto,
  SorteioSnapshotDto,
} from '../dto/sorteio.dto';
import { RodadaAtualDto } from '../dto/rodada-atual.dto';
import { SubmitTorneioMesaResultadoDto } from '../dto/submit-torneio-mesa-resultado.dto';
import {
  opponentKey,
  sortearMesasSuico,
  SorteioPlayer,
} from './swiss-pairing';
import {
  comandanteFromInscricao,
  deckNomeFromInscricao,
  inscricaoPreconInclude,
  inscricaoWithPreconInclude,
} from '../../precons/mappers/to-precon-response';

type InscricaoComUser = Prisma.InscricaoGetPayload<{
  include: typeof inscricaoWithPreconInclude;
}>;

export type ResultadoActor = { id: string; isAdmin: boolean };

/** Mesa com reporte: todos os jogadores têm posicaoFinal. */
function isMesaTorneioReportada(mesa: {
  jogadores: { posicaoFinal: number | null }[];
}): boolean {
  return (
    mesa.jogadores.length > 0 &&
    mesa.jogadores.every((j) => j.posicaoFinal != null)
  );
}

function isMesaTorneioValidada(mesa: { validada: boolean }): boolean {
  return mesa.validada === true;
}

function formatDataRodada(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Fuso fixo do projeto: UTC-3 (America/Sao_Paulo, sem horário de verão).
const TZ_OFFSET_MIN = -180;

/** Intervalo [início, fim] do dia de hoje em UTC-3, em instantes UTC. */
function hojeRangeUtc(now: Date = new Date()): { inicio: Date; fim: Date } {
  const local = new Date(now.getTime() + TZ_OFFSET_MIN * 60 * 1000);
  const inicioLocalUtcMs = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  const inicio = new Date(inicioLocalUtcMs - TZ_OFFSET_MIN * 60 * 1000);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { inicio, fim };
}

@Injectable()
export class SorteioService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(): Promise<SorteioSnapshotDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const rodadaCheckIn = await this.findRodadaCheckIn(campeonato.id);
    const rodadaComMesas = await this.findLatestRodadaComMesas(campeonato.id);

    const checkInSource = rodadaCheckIn ?? rodadaComMesas;
    const inscricoes = await this.loadInscricoes(campeonato.id);
    const checkInIds = checkInSource
      ? new Set(
          (
            await this.prisma.checkInRodada.findMany({
              where: { rodadaId: checkInSource.id },
              select: { inscricaoId: true },
            })
          ).map((c) => c.inscricaoId),
        )
      : new Set<string>();

    const eliminacoesMap = await this.buildEliminacoesMap(campeonato.id);
    const mesas = rodadaComMesas ? await this.loadMesasDto(rodadaComMesas.id) : [];

    const rodadaExibida = rodadaCheckIn ?? rodadaComMesas;
    const jaSorteada = !rodadaCheckIn && mesas.length > 0;
    const totalCheckIns = checkInIds.size;

    let podeSortear = false;
    let podeReSortear = false;

    if (rodadaCheckIn) {
      const prevOk = await this.isPreviousRodadaComplete(
        campeonato.id,
        rodadaCheckIn.numero,
      );
      podeSortear =
        prevOk &&
        totalCheckIns >= 3 &&
        (await this.countMesas(rodadaCheckIn.id)) === 0;
    }

    if (rodadaComMesas && !rodadaComMesas.finalizada) {
      const mesasDb = await this.prisma.mesaTorneio.findMany({
        where: { rodadaId: rodadaComMesas.id },
        include: { jogadores: true },
      });
      const hasResults = mesasDb.some((m) =>
        m.jogadores.some((j) => j.posicaoFinal != null),
      );
      podeReSortear = mesasDb.length > 0 && !hasResults;
    }

    return {
      campeonatoId: campeonato.id,
      campeonatoNome: campeonato.nome,
      rodadaId: rodadaExibida?.id ?? null,
      rodadaNumero: rodadaExibida?.numero ?? null,
      dataRodada: rodadaExibida ? formatDataRodada(rodadaExibida.dataRodada) : null,
      jaSorteada,
      totalCheckIns,
      podeSortear,
      podeReSortear,
      jogadores: inscricoes.map((i, index) => ({
        id: i.id,
        nomeJogador: i.user.nome,
        nick: i.user.nick,
        discordNick: i.discordNick,
        deckNome: deckNomeFromInscricao(i),
        comandante: comandanteFromInscricao(i),
        deckUrl: i.deckUrl,
        pontos: i.pontos,
        posicao: i.posicao ?? index + 1,
        eliminacoes: eliminacoesMap.get(i.id) ?? 0,
        checkIn: checkInIds.has(i.id),
      })),
      mesas,
    };
  }

  async listRodadas(): Promise<RodadasListResponseDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const contexto = await this.buildAbrirRodadaContext(campeonato.id);

    const rodadas = await this.prisma.rodada.findMany({
      where: { campeonatoId: campeonato.id },
      orderBy: { numero: 'desc' },
      include: {
        mesas: {
          orderBy: { numeroMesa: 'asc' },
          include: {
            jogadores: {
              include: {
                inscricao: {
                  include: {
                    user: { select: { nick: true } },
                    ...inscricaoPreconInclude,
                  },
                },
              },
            },
          },
        },
        _count: { select: { checkIns: true } },
      },
    });

    const items: RodadaListItemDto[] = rodadas.map((r) => {
      let status: RodadaListItemDto['status'];
      if (r.finalizada) {
        status = 'FINALIZADA';
      } else if (r.mesas.length > 0) {
        status = 'EM_ANDAMENTO';
      } else {
        status = 'CHECK_IN';
      }

      let mesasPendentes = 0;
      let mesasFinalizadas = 0;
      const mesas = r.mesas.map((m) => {
        const pendente = !isMesaTorneioValidada(m);
        if (pendente) mesasPendentes++;
        else mesasFinalizadas++;
        return {
          id: m.id,
          numeroMesa: m.numeroMesa,
          pendente,
          jogadores: m.jogadores.map((j) => ({
            inscricaoId: j.inscricaoId,
            nick: j.inscricao.user.nick,
            comandante: comandanteFromInscricao(j.inscricao),
          })),
        };
      });

      return {
        id: r.id,
        numero: r.numero,
        dataRodada: formatDataRodada(r.dataRodada),
        status,
        totalCheckIns: r._count.checkIns,
        mesasPendentes,
        mesasFinalizadas,
        mesas,
      };
    });

    return { contexto, rodadas: items };
  }

  async abrirRodada(dto: CreateRodadaDto): Promise<SorteioSnapshotDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    this.assertCampeonatoNotEncerrado(campeonato);

    const existingCheckIn = await this.findRodadaCheckIn(campeonato.id);
    if (existingCheckIn) {
      throw new ConflictException(
        'Já existe uma rodada aberta para check-in. Finalize o sorteio ou aguarde.',
      );
    }

    const duplicate = await this.prisma.rodada.findUnique({
      where: {
        campeonatoId_numero: {
          campeonatoId: campeonato.id,
          numero: dto.numero,
        },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        `Já existe a rodada ${dto.numero} neste campeonato.`,
      );
    }

    const prevOk = await this.isPreviousRodadaComplete(
      campeonato.id,
      dto.numero,
    );
    if (!prevOk) {
      throw new ConflictException(
        'Existem mesas pendentes na rodada anterior. Finalize-as antes de abrir uma nova rodada.',
      );
    }

    const dataRodada = new Date(`${dto.dataRodada}T12:00:00.000Z`);

    const rodada = await this.prisma.rodada.create({
      data: {
        campeonatoId: campeonato.id,
        numero: dto.numero,
        dataRodada,
        ativa: false,
      },
    });

    await this.notifyRodadaNova(campeonato, rodada);

    return this.getSnapshot();
  }

  async adminToggleCheckIn(
    inscricaoId: string,
    checkIn: boolean,
  ): Promise<SorteioSnapshotDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    this.assertCampeonatoNotEncerrado(campeonato);

    const rodada = await this.findRodadaCheckIn(campeonato.id);
    if (!rodada) {
      throw new ConflictException('Nenhuma rodada aberta para check-in.');
    }

    if ((await this.countMesas(rodada.id)) > 0) {
      throw new ConflictException(
        'As mesas desta rodada já foram sorteadas. Check-in encerrado.',
      );
    }

    const inscricao = await this.prisma.inscricao.findFirst({
      where: {
        id: inscricaoId,
        campeonatoId: campeonato.id,
        ativo: true,
      },
    });

    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada ou inativa.');
    }

    if (checkIn) {
      await this.prisma.checkInRodada.upsert({
        where: {
          rodadaId_inscricaoId: {
            rodadaId: rodada.id,
            inscricaoId: inscricao.id,
          },
        },
        create: { rodadaId: rodada.id, inscricaoId: inscricao.id },
        update: {},
      });
    } else {
      await this.prisma.checkInRodada.deleteMany({
        where: { rodadaId: rodada.id, inscricaoId: inscricao.id },
      });
    }

    return this.getSnapshot();
  }

  async reSortearMesas(): Promise<SorteioSnapshotDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    this.assertCampeonatoNotEncerrado(campeonato);

    const rodada = await this.findLatestRodadaComMesas(campeonato.id);
    if (!rodada) {
      throw new BadRequestException('Nenhuma rodada sorteada para re-sortear.');
    }

    if (rodada.finalizada) {
      throw new ConflictException('Esta rodada já foi finalizada.');
    }

    const mesas = await this.prisma.mesaTorneio.findMany({
      where: { rodadaId: rodada.id },
      include: { jogadores: true },
    });

    if (mesas.length === 0) {
      throw new BadRequestException('Esta rodada ainda não possui mesas sorteadas.');
    }

    const hasResults = mesas.some((m) =>
      m.jogadores.some((j) => j.posicaoFinal != null),
    );
    if (hasResults) {
      throw new ConflictException(
        'Não é possível re-sortear: já existem resultados registrados.',
      );
    }

    await this.prisma.mesaTorneio.deleteMany({
      where: { rodadaId: rodada.id },
    });

    await this.executeSorteio(campeonato, rodada);

    return this.getSnapshot();
  }

  async getRodadaAtual(): Promise<RodadaAtualDto | null> {
    const campeonato = await this.findCampeonatoAtualOrThrow();

    const ativa = await this.prisma.rodada.findFirst({
      where: {
        campeonatoId: campeonato.id,
        ativa: true,
        mesas: { some: {} },
      },
      orderBy: { numero: 'desc' },
    });

    const rodada =
      ativa ?? (await this.findLatestRodadaComMesas(campeonato.id));

    if (!rodada) {
      return null;
    }

    const mesas = await this.prisma.mesaTorneio.findMany({
      where: { rodadaId: rodada.id },
      orderBy: { numeroMesa: 'asc' },
      include: {
        jogadores: {
          include: {
            inscricao: {
              include: inscricaoWithPreconInclude,
            },
          },
        },
      },
    });

    const todasValidadas =
      mesas.length > 0 && mesas.every((m) => isMesaTorneioValidada(m));

    return {
      id: rodada.id,
      numero: rodada.numero,
      dataRodada: formatDataRodada(rodada.dataRodada),
      ativa: rodada.ativa,
      finalizada: rodada.finalizada,
      podeFinalizar: !rodada.finalizada && todasValidadas,
      mesas: mesas.map((m) => ({
        id: m.id,
        numeroMesa: m.numeroMesa,
        finalizada: isMesaTorneioReportada(m),
        validada: m.validada,
        validadaEm: m.validadaEm?.toISOString() ?? null,
        linkPartida: m.linkPartida,
        empate: m.empate,
        empatadosInscricaoIds: m.empatadosInscricaoIds,
        jogadores: m.jogadores.map((j) => ({
          inscricaoId: j.inscricao.id,
          nome: j.inscricao.user.nome,
          nickname: j.inscricao.user.nick,
          comandante: comandanteFromInscricao(j.inscricao),
          deckNome: deckNomeFromInscricao(j.inscricao),
          deckUrl: j.inscricao.deckUrl,
          rankingCampeonato: j.inscricao.posicao,
          posicaoFinal: j.posicaoFinal,
          kills: j.kills,
        })),
      })),
    };
  }

  async submitMesaResultado(
    mesaId: string,
    dto: SubmitTorneioMesaResultadoDto,
    actor: ResultadoActor,
  ): Promise<RodadaAtualDto> {
    const mesa = await this.prisma.mesaTorneio.findUnique({
      where: { id: mesaId },
      include: {
        jogadores: {
          include: { inscricao: { select: { userId: true } } },
        },
        rodada: true,
      },
    });

    if (!mesa) {
      throw new NotFoundException('Mesa não encontrada.');
    }

    if (mesa.rodada.finalizada) {
      throw new ConflictException('A rodada já foi finalizada.');
    }

    const naMesa = mesa.jogadores.some((j) => j.inscricao.userId === actor.id);
    if (!actor.isAdmin && !naMesa) {
      throw new ForbiddenException(
        'Apenas jogadores desta mesa ou admin podem gravar o resultado.',
      );
    }

    if (mesa.validada && !actor.isAdmin) {
      throw new ConflictException('Esta mesa já foi validada.');
    }

    const alocados = new Set(mesa.jogadores.map((j) => j.inscricaoId));
    const payloadIds = dto.jogadores.map((j) => j.inscricaoId);

    if (payloadIds.length !== alocados.size) {
      throw new BadRequestException(
        'Informe o resultado de todos os jogadores da mesa.',
      );
    }

    for (const id of payloadIds) {
      if (!alocados.has(id)) {
        throw new BadRequestException(
          `Inscrição ${id} não pertence a esta mesa.`,
        );
      }
    }

    const empate = dto.empate === true;
    const empatados = empate
      ? [...new Set(dto.empatadosInscricaoIds ?? [])]
      : [];

    if (empate && empatados.length < 2) {
      throw new BadRequestException(
        'Marque pelo menos dois jogadores empatados.',
      );
    }

    for (const id of empatados) {
      if (!alocados.has(id)) {
        throw new BadRequestException(
          `Empatado ${id} não pertence a esta mesa.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const jogador of dto.jogadores) {
        await tx.mesaTorneioJogador.updateMany({
          where: { mesaId, inscricaoId: jogador.inscricaoId },
          data: {
            posicaoFinal: jogador.posicao,
            kills: jogador.kills,
          },
        });
      }

      await tx.mesaTorneio.update({
        where: { id: mesaId },
        data: {
          empate,
          empatadosInscricaoIds: empatados,
          validada: actor.isAdmin,
          validadaEm: actor.isAdmin ? new Date() : null,
          ...(dto.linkPartida !== undefined
            ? { linkPartida: dto.linkPartida }
            : {}),
        },
      });
    });

    const rodadaAtual = await this.getRodadaAtual();
    if (!rodadaAtual) {
      throw new NotFoundException('Rodada não encontrada após salvar resultado.');
    }
    return rodadaAtual;
  }

  async finalizarRodada(rodadaId: string): Promise<RodadaAtualDto> {
    const rodada = await this.prisma.rodada.findUnique({
      where: { id: rodadaId },
      include: {
        mesas: {
          include: { jogadores: true },
        },
      },
    });

    if (!rodada) {
      throw new NotFoundException('Rodada não encontrada.');
    }

    if (rodada.finalizada) {
      throw new ConflictException('Esta rodada já foi finalizada.');
    }

    if (rodada.mesas.length === 0) {
      throw new BadRequestException('A rodada não possui mesas.');
    }

    if (!rodada.mesas.every((m) => isMesaTorneioValidada(m))) {
      throw new ConflictException(
        'Todas as mesas precisam estar validadas antes de finalizar a rodada.',
      );
    }

    const pontosDelta = new Map<string, number>();

    for (const mesa of rodada.mesas) {
      if (mesa.empate && mesa.empatadosInscricaoIds.length > 0) {
        for (const inscricaoId of mesa.empatadosInscricaoIds) {
          pontosDelta.set(
            inscricaoId,
            (pontosDelta.get(inscricaoId) ?? 0) + 1,
          );
        }
        continue;
      }

      for (const jogador of mesa.jogadores) {
        if (jogador.posicaoFinal === 1) {
          pontosDelta.set(
            jogador.inscricaoId,
            (pontosDelta.get(jogador.inscricaoId) ?? 0) + 3,
          );
        } else if (jogador.posicaoFinal === 2) {
          pontosDelta.set(
            jogador.inscricaoId,
            (pontosDelta.get(jogador.inscricaoId) ?? 0) + 1,
          );
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const [inscricaoId, delta] of pontosDelta) {
        if (delta <= 0) continue;
        await tx.inscricao.update({
          where: { id: inscricaoId },
          data: { pontos: { increment: delta } },
        });
      }

      const inscricoes = await tx.inscricao.findMany({
        where: { campeonatoId: rodada.campeonatoId, ativo: true },
        orderBy: [{ pontos: 'desc' }, { updatedAt: 'asc' }, { id: 'asc' }],
      });

      for (let i = 0; i < inscricoes.length; i++) {
        await tx.inscricao.update({
          where: { id: inscricoes[i].id },
          data: { posicao: i + 1 },
        });
      }

      await tx.rodada.update({
        where: { id: rodadaId },
        data: { finalizada: true, ativa: false },
      });
    });

    const rodadaAtual = await this.getRodadaAtual();
    if (!rodadaAtual) {
      throw new NotFoundException('Rodada não encontrada após finalizar.');
    }
    return rodadaAtual;
  }

  async getCheckInStatus(userId: string): Promise<CheckInStatusDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const inscricao = await this.prisma.inscricao.findUnique({
      where: {
        campeonatoId_userId: { campeonatoId: campeonato.id, userId },
      },
    });

    const rodada = await this.findRodadaCheckIn(campeonato.id);

    if (!rodada) {
      return {
        rodadaId: null,
        rodadaNumero: null,
        checkIn: false,
        jaInscrito: !!inscricao?.ativo,
        podeCheckIn: false,
      };
    }

    if (!inscricao || !inscricao.ativo) {
      return {
        rodadaId: rodada.id,
        rodadaNumero: rodada.numero,
        checkIn: false,
        jaInscrito: false,
        podeCheckIn: false,
      };
    }

    const mesasCount = await this.countMesas(rodada.id);
    const checkIn = await this.prisma.checkInRodada.findUnique({
      where: {
        rodadaId_inscricaoId: {
          rodadaId: rodada.id,
          inscricaoId: inscricao.id,
        },
      },
    });

    return {
      rodadaId: rodada.id,
      rodadaNumero: rodada.numero,
      checkIn: !!checkIn,
      jaInscrito: true,
      podeCheckIn: mesasCount === 0,
    };
  }

  async checkIn(userId: string): Promise<CheckInStatusDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    this.assertCampeonatoNotEncerrado(campeonato);

    const inscricao = await this.prisma.inscricao.findUnique({
      where: {
        campeonatoId_userId: { campeonatoId: campeonato.id, userId },
      },
    });

    if (!inscricao || !inscricao.ativo) {
      throw new NotFoundException('Você não está inscrito neste precompeonato.');
    }

    const rodada = await this.findRodadaCheckIn(campeonato.id);
    if (!rodada) {
      throw new ConflictException('Nenhuma rodada aberta para check-in.');
    }

    if ((await this.countMesas(rodada.id)) > 0) {
      throw new ConflictException(
        'As mesas desta rodada já foram sorteadas. Check-in encerrado.',
      );
    }

    await this.prisma.checkInRodada.upsert({
      where: {
        rodadaId_inscricaoId: {
          rodadaId: rodada.id,
          inscricaoId: inscricao.id,
        },
      },
      create: { rodadaId: rodada.id, inscricaoId: inscricao.id },
      update: {},
    });

    return this.getCheckInStatus(userId);
  }

  async cancelCheckIn(userId: string): Promise<CheckInStatusDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const inscricao = await this.prisma.inscricao.findUnique({
      where: {
        campeonatoId_userId: { campeonatoId: campeonato.id, userId },
      },
    });

    if (!inscricao) {
      throw new NotFoundException('Você não está inscrito neste precompeonato.');
    }

    const rodada = await this.findRodadaCheckIn(campeonato.id);
    if (!rodada) {
      return this.getCheckInStatus(userId);
    }

    if ((await this.countMesas(rodada.id)) > 0) {
      throw new ConflictException(
        'As mesas desta rodada já foram sorteadas. Não é possível cancelar o check-in.',
      );
    }

    await this.prisma.checkInRodada.deleteMany({
      where: { rodadaId: rodada.id, inscricaoId: inscricao.id },
    });

    return this.getCheckInStatus(userId);
  }

  async sortearMesas(): Promise<SorteioSnapshotDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    this.assertCampeonatoNotEncerrado(campeonato);

    const rodada = await this.findRodadaCheckIn(campeonato.id);
    if (!rodada) {
      throw new BadRequestException(
        'Nenhuma rodada aberta para check-in. Abra uma rodada antes de sortear.',
      );
    }

    if ((await this.countMesas(rodada.id)) > 0) {
      throw new ConflictException(
        'Esta rodada já possui mesas sorteadas. Use re-sortear se ainda não houver resultados.',
      );
    }

    await this.executeSorteio(campeonato, rodada);

    return this.getSnapshot();
  }

  private async executeSorteio(
    campeonato: Campeonato,
    rodada: Rodada,
  ): Promise<void> {
    const prevOk = await this.isPreviousRodadaComplete(
      campeonato.id,
      rodada.numero,
    );
    if (!prevOk) {
      throw new ConflictException(
        'Existem mesas pendentes na rodada anterior. Finalize-as antes de sortear.',
      );
    }

    const checkIns = (
      await this.prisma.checkInRodada.findMany({
        where: { rodadaId: rodada.id },
        include: {
          inscricao: {
            include: {
              user: { select: { nome: true, nick: true } },
              ...inscricaoPreconInclude,
            },
          },
        },
      })
    ).filter((c) => c.inscricao.ativo);

    if (checkIns.length < 3) {
      throw new BadRequestException(
        'É necessário pelo menos 3 jogadores com check-in para sortear as mesas.',
      );
    }

    const players: SorteioPlayer[] = checkIns.map((c) => ({
      id: c.inscricaoId,
      pontos: c.inscricao.pontos,
      deckNome: deckNomeFromInscricao(c.inscricao),
    }));

    const opponents = await this.buildOpponentSet(campeonato.id, rodada.numero);
    const mesasPlan = sortearMesasSuico(players, rodada.numero, opponents);

    if (mesasPlan.length === 0) {
      throw new BadRequestException(
        'Não foi possível formar mesas com os check-ins atuais.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rodada.updateMany({
        where: { campeonatoId: campeonato.id, ativa: true },
        data: { ativa: false },
      });
      await tx.rodada.update({
        where: { id: rodada.id },
        data: { ativa: true },
      });

      if (campeonato.status === CampeonatoStatus.INSCRICOES_ABERTAS) {
        await tx.campeonato.update({
          where: { id: campeonato.id },
          data: { status: CampeonatoStatus.EM_ANDAMENTO },
        });
      }

      for (const mesa of mesasPlan) {
        const created = await tx.mesaTorneio.create({
          data: {
            rodadaId: rodada.id,
            numeroMesa: mesa.numeroMesa,
          },
        });
        await tx.mesaTorneioJogador.createMany({
          data: mesa.jogadorIds.map((inscricaoId) => ({
            mesaId: created.id,
            inscricaoId,
          })),
        });
      }
    });
  }

  private async buildAbrirRodadaContext(
    campeonatoId: string,
  ): Promise<AbrirRodadaContextDto> {
    const last = await this.prisma.rodada.findFirst({
      where: { campeonatoId },
      orderBy: { numero: 'desc' },
    });
    const proximoNumero = (last?.numero ?? 0) + 1;
    const rodadaCheckIn = await this.findRodadaCheckIn(campeonatoId);

    if (rodadaCheckIn) {
      return {
        proximoNumero,
        podeAbrirRodada: false,
        bloqueioMotivo: 'Já existe uma rodada aberta para check-in.',
        rodadaCheckInId: rodadaCheckIn.id,
      };
    }

    const prevOk = await this.isPreviousRodadaComplete(
      campeonatoId,
      proximoNumero,
    );
    if (!prevOk) {
      return {
        proximoNumero,
        podeAbrirRodada: false,
        bloqueioMotivo:
          'Existem mesas pendentes na rodada anterior. Finalize-as antes de abrir uma nova rodada.',
        rodadaCheckInId: null,
      };
    }

    return {
      proximoNumero,
      podeAbrirRodada: true,
      bloqueioMotivo: null,
      rodadaCheckInId: null,
    };
  }

  private async isPreviousRodadaComplete(
    campeonatoId: string,
    rodadaNumero: number,
  ): Promise<boolean> {
    if (rodadaNumero <= 1) return true;

    const prev = await this.prisma.rodada.findFirst({
      where: {
        campeonatoId,
        numero: rodadaNumero - 1,
      },
      include: { mesas: { include: { jogadores: true } } },
    });

    if (!prev || prev.mesas.length === 0) return true;

    return prev.mesas.every((m) => isMesaTorneioValidada(m));
  }

  private async notifyRodadaNova(
    campeonato: Campeonato,
    rodada: Rodada,
  ): Promise<void> {
    const inscricoes = await this.prisma.inscricao.findMany({
      where: { campeonatoId: campeonato.id, ativo: true },
      select: { userId: true },
    });

    if (inscricoes.length === 0) return;

    const dataFmt = formatDataRodada(rodada.dataRodada);
    await this.prisma.notificacao.createMany({
      data: inscricoes.map((i) => ({
        userId: i.userId,
        tipo: 'rodada_nova',
        titulo: `Rodada ${rodada.numero} aberta`,
        mensagem: `Check-in disponível para a rodada ${rodada.numero} (${dataFmt}).`,
      })),
    });
  }

  /**
   * Notifica os jogadores das rodadas de torneio marcadas para hoje (UTC-3).
   * Se a rodada já tem mesas sorteadas, notifica os jogadores das mesas;
   * caso contrário, notifica os inscritos ativos do campeonato.
   * Chamado por cron diário. Retorna quantas notificações foram criadas.
   */
  async notificarRodadasDeHoje(): Promise<number> {
    const { inicio, fim } = hojeRangeUtc();

    const rodadas = await this.prisma.rodada.findMany({
      where: {
        finalizada: false,
        dataRodada: { gte: inicio, lte: fim },
      },
      include: {
        mesas: { include: { jogadores: { include: { inscricao: { select: { userId: true } } } } } },
      },
    });

    const dados: {
      userId: string;
      tipo: string;
      titulo: string;
      mensagem: string;
    }[] = [];

    for (const rodada of rodadas) {
      const userIds = new Set<string>();

      const jogadoresSorteados = rodada.mesas.flatMap((m) => m.jogadores);
      if (jogadoresSorteados.length > 0) {
        for (const j of jogadoresSorteados) userIds.add(j.inscricao.userId);
      } else {
        const inscritos = await this.prisma.inscricao.findMany({
          where: { campeonatoId: rodada.campeonatoId, ativo: true },
          select: { userId: true },
        });
        for (const i of inscritos) userIds.add(i.userId);
      }

      for (const uid of userIds) {
        dados.push({
          userId: uid,
          tipo: 'dia_do_evento',
          titulo: `Rodada ${rodada.numero} é hoje!`,
          mensagem: `A rodada ${rodada.numero} do campeonato acontece hoje. Não esqueça o check-in!`,
        });
      }
    }

    if (dados.length === 0) return 0;

    const { count } = await this.prisma.notificacao.createMany({ data: dados });
    return count;
  }

  private assertCampeonatoNotEncerrado(campeonato: Campeonato): void {
    if (campeonato.status === CampeonatoStatus.ENCERRADO) {
      throw new ConflictException('O precompeonato está encerrado.');
    }
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

  /** Rodada sem mesas (aberta para check-in), ou null. */
  private async findRodadaCheckIn(campeonatoId: string) {
    const rodadas = await this.prisma.rodada.findMany({
      where: { campeonatoId, finalizada: false },
      orderBy: { numero: 'asc' },
      include: { _count: { select: { mesas: true } } },
    });
    return rodadas.find((r) => r._count.mesas === 0) ?? null;
  }

  /** Última rodada que já tem mesas sorteadas. */
  private async findLatestRodadaComMesas(campeonatoId: string) {
    const rodadas = await this.prisma.rodada.findMany({
      where: { campeonatoId },
      orderBy: { numero: 'desc' },
      include: { _count: { select: { mesas: true } } },
    });
    return rodadas.find((r) => r._count.mesas > 0) ?? null;
  }

  private async countMesas(rodadaId: string): Promise<number> {
    return this.prisma.mesaTorneio.count({ where: { rodadaId } });
  }

  private async loadInscricoes(campeonatoId: string): Promise<InscricaoComUser[]> {
    const list = await this.prisma.inscricao.findMany({
      where: { campeonatoId, ativo: true },
      include: inscricaoWithPreconInclude,
      orderBy: [{ posicao: 'asc' }, { pontos: 'desc' }],
    });
    return [...list].sort((a, b) => {
      if (a.posicao == null && b.posicao == null) return b.pontos - a.pontos;
      if (a.posicao == null) return 1;
      if (b.posicao == null) return -1;
      if (a.posicao !== b.posicao) return a.posicao - b.posicao;
      return b.pontos - a.pontos;
    });
  }

  private async loadMesasDto(rodadaId: string): Promise<SorteioMesaDto[]> {
    const mesas = await this.prisma.mesaTorneio.findMany({
      where: { rodadaId },
      orderBy: { numeroMesa: 'asc' },
      include: {
        jogadores: {
          include: {
            inscricao: {
              include: inscricaoWithPreconInclude,
            },
          },
        },
      },
    });

    return mesas.map((m) => ({
      id: m.id,
      numeroMesa: m.numeroMesa,
      jogadores: m.jogadores.map((j) => ({
        id: j.inscricao.id,
        nomeJogador: j.inscricao.user.nome,
        nick: j.inscricao.user.nick,
        discordNick: j.inscricao.discordNick,
        deckNome: deckNomeFromInscricao(j.inscricao),
        comandante: comandanteFromInscricao(j.inscricao),
        pontos: j.inscricao.pontos,
      })),
    }));
  }

  private async buildOpponentSet(
    campeonatoId: string,
    beforeRodadaNumero: number,
  ): Promise<Set<string>> {
    const set = new Set<string>();
    const mesas = await this.prisma.mesaTorneio.findMany({
      where: {
        rodada: {
          campeonatoId,
          numero: { lt: beforeRodadaNumero },
        },
      },
      include: { jogadores: { select: { inscricaoId: true } } },
    });

    for (const mesa of mesas) {
      const ids = mesa.jogadores.map((j) => j.inscricaoId);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          set.add(opponentKey(ids[i], ids[j]));
        }
      }
    }
    return set;
  }

  private async buildEliminacoesMap(campeonatoId: string): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    const rows = await this.prisma.mesaTorneioJogador.findMany({
      where: {
        mesa: { rodada: { campeonatoId } },
        kills: { gt: 0 },
      },
      select: { inscricaoId: true, kills: true },
    });
    for (const row of rows) {
      map.set(row.inscricaoId, (map.get(row.inscricaoId) ?? 0) + row.kills);
    }
    return map;
  }
}
