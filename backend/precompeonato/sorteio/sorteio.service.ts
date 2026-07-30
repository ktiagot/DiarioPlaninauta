import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campeonato, CampeonatoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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

type InscricaoComUser = Prisma.InscricaoGetPayload<{
  include: { user: { select: { nome: true; nick: true } } };
}>;

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

    // Rodada exibida: a aberta para check-in/sorteio, senão a última já pareada
    const rodadaExibida = rodadaCheckIn ?? rodadaComMesas;
    const jaSorteada = !rodadaCheckIn && mesas.length > 0;

    return {
      campeonatoId: campeonato.id,
      campeonatoNome: campeonato.nome,
      rodadaId: rodadaExibida?.id ?? null,
      rodadaNumero: rodadaExibida?.numero ?? null,
      jaSorteada,
      totalCheckIns: checkInIds.size,
      jogadores: inscricoes.map((i, index) => ({
        id: i.id,
        nomeJogador: i.user.nome,
        nick: i.user.nick,
        discordNick: i.discordNick,
        deckNome: i.deckNome,
        comandante: i.comandante,
        deckUrl: i.deckUrl,
        pontos: i.pontos,
        posicao: i.posicao ?? index + 1,
        eliminacoes: eliminacoesMap.get(i.id) ?? 0,
        checkIn: checkInIds.has(i.id),
      })),
      mesas,
    };
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
              include: { user: { select: { nome: true, nick: true } } },
            },
          },
        },
      },
    });

    const todasFinalizadas =
      mesas.length > 0 && mesas.every((m) => m.finalizada);

    return {
      id: rodada.id,
      numero: rodada.numero,
      dataRodada: rodada.createdAt.toISOString(),
      ativa: rodada.ativa,
      finalizada: rodada.finalizada,
      podeFinalizar: !rodada.finalizada && todasFinalizadas,
      mesas: mesas.map((m) => ({
        id: m.id,
        numeroMesa: m.numeroMesa,
        finalizada: m.finalizada,
        linkPartida: m.linkPartida,
        empate: m.empate,
        empatadosInscricaoIds: m.empatadosInscricaoIds,
        jogadores: m.jogadores.map((j) => ({
          inscricaoId: j.inscricao.id,
          nome: j.inscricao.user.nome,
          nickname: j.inscricao.user.nick,
          comandante: j.inscricao.comandante,
          deckNome: j.inscricao.deckNome,
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
  ): Promise<RodadaAtualDto> {
    const mesa = await this.prisma.mesaTorneio.findUnique({
      where: { id: mesaId },
      include: {
        jogadores: true,
        rodada: true,
      },
    });

    if (!mesa) {
      throw new NotFoundException('Mesa não encontrada.');
    }

    if (mesa.finalizada) {
      throw new ConflictException('Esta mesa já foi finalizada.');
    }

    if (mesa.rodada.finalizada) {
      throw new ConflictException('A rodada já foi finalizada.');
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
          finalizada: true,
          empate,
          empatadosInscricaoIds: empatados,
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

    if (!rodada.mesas.every((m) => m.finalizada)) {
      throw new ConflictException(
        'Todas as mesas precisam estar finalizadas antes de finalizar a rodada.',
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

    const rodada = await this.getOrCreateRodadaParaCheckIn(campeonato);

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
    if (campeonato.status === CampeonatoStatus.ENCERRADO) {
      throw new ConflictException('O precompeonato está encerrado.');
    }

    const inscricao = await this.prisma.inscricao.findUnique({
      where: {
        campeonatoId_userId: { campeonatoId: campeonato.id, userId },
      },
    });

    if (!inscricao || !inscricao.ativo) {
      throw new NotFoundException('Você não está inscrito neste precompeonato.');
    }

    const rodada = await this.getOrCreateRodadaParaCheckIn(campeonato);
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

    if (campeonato.status === CampeonatoStatus.ENCERRADO) {
      throw new ConflictException('O precompeonato está encerrado.');
    }

    const rodada = await this.getOrCreateRodadaParaCheckIn(campeonato);

    if ((await this.countMesas(rodada.id)) > 0) {
      throw new ConflictException('Esta rodada já possui mesas sorteadas.');
    }

    const prev = await this.prisma.rodada.findFirst({
      where: {
        campeonatoId: campeonato.id,
        numero: rodada.numero - 1,
      },
      include: { mesas: true },
    });

    if (prev && prev.mesas.some((m) => !m.finalizada)) {
      throw new ConflictException(
        'Existem mesas pendentes na rodada anterior. Finalize-as antes de sortear.',
      );
    }

    const checkIns = await this.prisma.checkInRodada.findMany({
      where: { rodadaId: rodada.id },
      include: {
        inscricao: {
          include: { user: { select: { nome: true, nick: true } } },
        },
      },
    });

    if (checkIns.length < 3) {
      throw new BadRequestException(
        'É necessário pelo menos 3 jogadores com check-in para sortear as mesas.',
      );
    }

    const players: SorteioPlayer[] = checkIns.map((c) => ({
      id: c.inscricaoId,
      pontos: c.inscricao.pontos,
      deckNome: c.inscricao.deckNome,
    }));

    const opponents = await this.buildOpponentSet(campeonato.id, rodada.numero);
    const mesasPlan = sortearMesasSuico(players, rodada.numero, opponents);

    if (mesasPlan.length === 0) {
      throw new BadRequestException('Não foi possível formar mesas com os check-ins atuais.');
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

    return this.getSnapshot();
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
      where: { campeonatoId },
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

  private async getOrCreateRodadaParaCheckIn(campeonato: Campeonato) {
    const existing = await this.findRodadaCheckIn(campeonato.id);
    if (existing) return existing;

    const last = await this.prisma.rodada.findFirst({
      where: { campeonatoId: campeonato.id },
      orderBy: { numero: 'desc' },
    });

    return this.prisma.rodada.create({
      data: {
        campeonatoId: campeonato.id,
        numero: (last?.numero ?? 0) + 1,
        ativa: false,
      },
    });
  }

  private async countMesas(rodadaId: string): Promise<number> {
    return this.prisma.mesaTorneio.count({ where: { rodadaId } });
  }

  private async loadInscricoes(campeonatoId: string): Promise<InscricaoComUser[]> {
    const list = await this.prisma.inscricao.findMany({
      where: { campeonatoId, ativo: true },
      include: { user: { select: { nome: true, nick: true } } },
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
              include: { user: { select: { nome: true, nick: true } } },
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
        deckNome: j.inscricao.deckNome,
        comandante: j.inscricao.comandante,
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
