import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campeonato, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from '../precons/precons.service';
import { RodadaAtualDto } from './dto/rodada-atual.dto';
import {
  AjustePontosDto,
  AjustePontosResponseDto,
  ColocarJogadorMesaDto,
  UpdateInscricaoAdminDto,
  UpdateRodadaDto,
} from './dto/gestao.dto';
import { findCampeonatoAtual } from './campeonato-atual';
import { recalcularRanking } from './sorteio/ranking';
import { SorteioService } from './sorteio/sorteio.service';

const MAX_JOGADORES_MESA = 5;

/**
 * Ações manuais de admin sobre rodadas, mesas e inscrições do campeonato atual.
 * Valem também para campeonato encerrado (correções pós-encerramento); o ranking é recalculado.
 */
@Injectable()
export class GestaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sorteioService: SorteioService,
    private readonly preconsService: PreconsService,
  ) {}

  // ---------- Ranking ----------

  /** Recalcula pontos e posições (aplica os critérios de desempate) sem alterar resultados. */
  async recalcularRanking(): Promise<void> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    await this.prisma.$transaction(async (tx) => {
      await recalcularRanking(tx, campeonato.id);
    });
  }

  // ---------- Rodadas ----------

  async atualizarRodada(rodadaId: string, dto: UpdateRodadaDto): Promise<RodadaAtualDto> {
    const { rodada, campeonato } = await this.getRodadaOrThrow(rodadaId);

    const data: Prisma.RodadaUpdateInput = {};
    if (dto.numero !== undefined && dto.numero !== rodada.numero) {
      const dup = await this.prisma.rodada.findUnique({
        where: {
          campeonatoId_numero: { campeonatoId: campeonato.id, numero: dto.numero },
        },
      });
      if (dup) {
        throw new ConflictException(`Já existe a rodada ${dto.numero} neste campeonato.`);
      }
      data.numero = dto.numero;
    }
    if (dto.dataRodada !== undefined) {
      data.dataRodada = new Date(`${dto.dataRodada}T12:00:00.000Z`);
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.rodada.update({ where: { id: rodadaId }, data });
    }
    return this.sorteioService.getRodadaDetalhe(rodadaId);
  }

  async reabrirRodada(rodadaId: string): Promise<RodadaAtualDto> {
    const { rodada, campeonato } = await this.getRodadaOrThrow(rodadaId);

    if (!rodada.finalizada) {
      throw new ConflictException('Esta rodada não está finalizada.');
    }

    const posterior = await this.prisma.rodada.findFirst({
      where: {
        campeonatoId: campeonato.id,
        numero: { gt: rodada.numero },
        mesas: { some: {} },
      },
    });
    if (posterior) {
      throw new ConflictException(
        `Só é possível reabrir a última rodada com mesas (existe a rodada ${posterior.numero}).`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rodada.update({
        where: { id: rodadaId },
        data: { finalizada: false, ativa: true },
      });
      await recalcularRanking(tx, campeonato.id);
    });

    return this.sorteioService.getRodadaDetalhe(rodadaId);
  }

  async excluirRodada(rodadaId: string): Promise<void> {
    const { rodada, campeonato } = await this.getRodadaOrThrow(rodadaId);

    if (rodada.finalizada) {
      throw new ConflictException('Reabra a rodada antes de excluí-la.');
    }

    // Mesas, jogadores das mesas e check-ins saem em cascata.
    await this.prisma.rodada.delete({ where: { id: rodadaId } });
  }

  // ---------- Mesas ----------

  async criarMesa(rodadaId: string): Promise<RodadaAtualDto> {
    const { rodada, campeonato } = await this.getRodadaOrThrow(rodadaId);
    this.assertEstruturaEditavel(rodada.finalizada);

    const ultima = await this.prisma.mesaTorneio.aggregate({
      where: { rodadaId },
      _max: { numeroMesa: true },
    });

    await this.prisma.mesaTorneio.create({
      data: { rodadaId, numeroMesa: (ultima._max.numeroMesa ?? 0) + 1 },
    });
    return this.sorteioService.getRodadaDetalhe(rodadaId);
  }

  async excluirMesa(mesaId: string): Promise<RodadaAtualDto> {
    const { mesa, campeonato } = await this.getMesaOrThrow(mesaId);
    this.assertEstruturaEditavel(mesa.rodada.finalizada);

    await this.prisma.mesaTorneio.delete({ where: { id: mesaId } });
    return this.sorteioService.getRodadaDetalhe(mesa.rodadaId);
  }

  /** Coloca o jogador na mesa; se já estiver em outra mesa da rodada, move. */
  async colocarJogador(mesaId: string, dto: ColocarJogadorMesaDto): Promise<RodadaAtualDto> {
    const { mesa, campeonato } = await this.getMesaOrThrow(mesaId);
    this.assertEstruturaEditavel(mesa.rodada.finalizada);

    const inscricao = await this.prisma.inscricao.findFirst({
      where: { id: dto.inscricaoId, campeonatoId: campeonato.id, ativo: true },
      select: { id: true },
    });
    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada ou inativa.');
    }

    await this.prisma.$transaction(async (tx) => {
      const atual = await tx.mesaTorneioJogador.findFirst({
        where: { inscricaoId: inscricao.id, mesa: { rodadaId: mesa.rodadaId } },
      });

      if (atual?.mesaId === mesaId) return;

      const ocupacao = await tx.mesaTorneioJogador.count({ where: { mesaId } });
      if (ocupacao >= MAX_JOGADORES_MESA) {
        throw new ConflictException(`A mesa já tem ${MAX_JOGADORES_MESA} jogadores.`);
      }

      if (atual) {
        await tx.mesaTorneioJogador.delete({ where: { id: atual.id } });
        await this.invalidar(tx, atual.mesaId);
      }

      await tx.mesaTorneioJogador.create({
        data: { mesaId, inscricaoId: inscricao.id },
      });
      await this.invalidar(tx, mesaId);
    });

    return this.sorteioService.getRodadaDetalhe(mesa.rodadaId);
  }

  async removerJogador(mesaId: string, inscricaoId: string): Promise<RodadaAtualDto> {
    const { mesa, campeonato } = await this.getMesaOrThrow(mesaId);
    this.assertEstruturaEditavel(mesa.rodada.finalizada);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.mesaTorneioJogador.deleteMany({
        where: { mesaId, inscricaoId },
      });
      if (count === 0) {
        throw new NotFoundException('Jogador não está nesta mesa.');
      }
      await this.invalidar(tx, mesaId);
    });

    return this.sorteioService.getRodadaDetalhe(mesa.rodadaId);
  }

  async invalidarMesa(mesaId: string): Promise<RodadaAtualDto> {
    const { mesa, campeonato } = await this.getMesaOrThrow(mesaId);

    await this.invalidar(this.prisma, mesaId);
    return this.sorteioService.getRodadaDetalhe(mesa.rodadaId);
  }

  async limparResultado(mesaId: string): Promise<RodadaAtualDto> {
    const { mesa, campeonato } = await this.getMesaOrThrow(mesaId);

    await this.prisma.$transaction(async (tx) => {
      await tx.mesaTorneioJogador.updateMany({
        where: { mesaId },
        data: { posicaoFinal: null, kills: 0 },
      });
      await tx.mesaTorneio.update({
        where: { id: mesaId },
        data: {
          empate: false,
          empatadosInscricaoIds: [],
          validada: false,
          validadaEm: null,
        },
      });
      if (mesa.rodada.finalizada) {
        await recalcularRanking(tx, campeonato.id);
      }
    });

    return this.sorteioService.getRodadaDetalhe(mesa.rodadaId);
  }

  // ---------- Inscrições ----------

  async ajustarPontos(
    inscricaoId: string,
    dto: AjustePontosDto,
    adminUserId: string,
  ): Promise<AjustePontosResponseDto> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    await this.getInscricaoOrThrow(inscricaoId, campeonato.id);

    if (dto.delta === 0) {
      throw new BadRequestException('O ajuste não pode ser zero.');
    }

    const log = await this.prisma.$transaction(async (tx) => {
      const criado = await tx.ajustePontos.create({
        data: {
          inscricaoId,
          delta: dto.delta,
          motivo: dto.motivo.trim(),
          adminUserId,
        },
      });
      await tx.inscricao.update({
        where: { id: inscricaoId },
        data: { pontosAjuste: { increment: dto.delta } },
      });
      await recalcularRanking(tx, campeonato.id);
      return criado;
    });

    return this.toAjusteResponse(log);
  }

  async listarAjustes(inscricaoId: string): Promise<AjustePontosResponseDto[]> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    await this.getInscricaoOrThrow(inscricaoId, campeonato.id);

    const ajustes = await this.prisma.ajustePontos.findMany({
      where: { inscricaoId },
      orderBy: { createdAt: 'desc' },
    });
    return ajustes.map((a) => this.toAjusteResponse(a));
  }

  async atualizarInscricao(inscricaoId: string, dto: UpdateInscricaoAdminDto): Promise<void> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const inscricao = await this.getInscricaoOrThrow(inscricaoId, campeonato.id);

    const data: Prisma.InscricaoUncheckedUpdateInput = {};

    if (dto.grupoId !== undefined) {
      if (dto.grupoId === null) {
        data.grupoId = null;
      } else {
        const grupo = await this.prisma.grupoCampeonato.findFirst({
          where: { id: dto.grupoId, campeonatoId: campeonato.id },
          select: { id: true },
        });
        if (!grupo) {
          throw new BadRequestException('Grupo inválido para este campeonato.');
        }
        data.grupoId = grupo.id;
      }
    }

    if (dto.discordNick !== undefined) data.discordNick = dto.discordNick.trim();
    if (dto.deckUrl !== undefined) data.deckUrl = dto.deckUrl;

    const mudaDeck =
      dto.preconId !== undefined ||
      dto.preconComandanteId !== undefined ||
      dto.preconComandante2Id !== undefined;
    if (mudaDeck) {
      const preconId = dto.preconId ?? inscricao.preconId;
      const trocouPrecon = dto.preconId !== undefined && dto.preconId !== inscricao.preconId;
      if (trocouPrecon && !dto.preconComandanteId) {
        throw new BadRequestException('Ao trocar o precon, informe também o comandante.');
      }
      const cmd1 = dto.preconComandanteId ?? inscricao.preconComandanteId;
      const cmd2 =
        dto.preconComandante2Id !== undefined
          ? dto.preconComandante2Id
          : trocouPrecon
            ? null
            : inscricao.preconComandante2Id;

      const valido = await this.preconsService.validateForInscricao(preconId, cmd1, cmd2, true);
      data.preconId = valido.preconId;
      data.preconComandanteId = valido.preconComandanteId;
      data.preconComandante2Id = valido.preconComandante2Id;
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.inscricao.update({ where: { id: inscricaoId }, data });
    }
  }

  async removerInscricao(inscricaoId: string): Promise<void> {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    await this.getInscricaoOrThrow(inscricaoId, campeonato.id);

    const emMesas = await this.prisma.mesaTorneioJogador.count({ where: { inscricaoId } });
    if (emMesas > 0) {
      throw new ConflictException(
        'Esta inscrição já participou de mesas. Remova o jogador das mesas ou apenas suspenda a inscrição.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inscricao.delete({ where: { id: inscricaoId } });
      await recalcularRanking(tx, campeonato.id);
    });
  }

  // ---------- helpers ----------

  private async invalidar(
    client: Pick<Prisma.TransactionClient, 'mesaTorneio'>,
    mesaId: string,
  ): Promise<void> {
    await client.mesaTorneio.update({
      where: { id: mesaId },
      data: { validada: false, validadaEm: null },
    });
  }

  private toAjusteResponse(a: {
    id: string;
    delta: number;
    motivo: string;
    adminUserId: string;
    createdAt: Date;
  }): AjustePontosResponseDto {
    return {
      id: a.id,
      delta: a.delta,
      motivo: a.motivo,
      adminUserId: a.adminUserId,
      createdAt: a.createdAt.toISOString(),
    };
  }

  private assertEstruturaEditavel(rodadaFinalizada: boolean): void {
    if (rodadaFinalizada) {
      throw new ConflictException('Rodada finalizada. Reabra a rodada para alterar as mesas.');
    }
  }

  private async findCampeonatoAtualOrThrow(): Promise<Campeonato> {
    const campeonato = await findCampeonatoAtual(this.prisma);
    if (!campeonato) {
      throw new NotFoundException('Nenhum precompeonato encontrado.');
    }
    return campeonato;
  }

  private async getRodadaOrThrow(rodadaId: string) {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const rodada = await this.prisma.rodada.findFirst({
      where: { id: rodadaId, campeonatoId: campeonato.id },
    });
    if (!rodada) {
      throw new NotFoundException('Rodada não encontrada.');
    }
    return { rodada, campeonato };
  }

  private async getMesaOrThrow(mesaId: string) {
    const campeonato = await this.findCampeonatoAtualOrThrow();
    const mesa = await this.prisma.mesaTorneio.findFirst({
      where: { id: mesaId, rodada: { campeonatoId: campeonato.id } },
      include: { rodada: true },
    });
    if (!mesa) {
      throw new NotFoundException('Mesa não encontrada.');
    }
    return { mesa, campeonato };
  }

  private async getInscricaoOrThrow(inscricaoId: string, campeonatoId: string) {
    const inscricao = await this.prisma.inscricao.findFirst({
      where: { id: inscricaoId, campeonatoId },
    });
    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada.');
    }
    return inscricao;
  }
}
