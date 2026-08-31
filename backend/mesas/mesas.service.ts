import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from '../precons/precons.service';
import { mesaJogadorPreconInclude } from '../precons/mappers/to-precon-response';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { MesaResponseDto } from './dto/mesa-response.dto';
import { SubmitMesaResultadoDto } from './dto/submit-mesa-resultado.dto';
import { UpdateMesaLinkDto } from './dto/update-mesa-link.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { toMesaResponse } from './mappers/to-mesa-response';

const mesaInclude = {
  jogadores: {
    include: {
      user: {
        select: {
          id: true,
          nome: true,
          sobrenome: true,
          nick: true,
        },
      },
      ...mesaJogadorPreconInclude,
    },
  },
  eliminacoes: true,
} as const;

@Injectable()
export class MesasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preconsService: PreconsService,
  ) {}

  async findAll(): Promise<MesaResponseDto[]> {
    const mesas = await this.prisma.mesa.findMany({
      include: mesaInclude,
      orderBy: { createdAt: 'asc' },
    });

    return mesas.map(toMesaResponse);
  }

  async create(userId: string, dto: CreateMesaDto): Promise<MesaResponseDto> {
    const precon = await this.preconsService.validateOptionalForMesa(
      dto.preconId,
      dto.preconComandanteId,
    );

    const mesa = await this.prisma.mesa.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        dataHora: new Date(dto.dataHora),
        linkPartida: dto.linkPartida ?? null,
        criadorUserId: userId,
        jogadores: {
          create: {
            userId,
            preconId: precon.preconId,
            preconComandanteId: precon.preconComandanteId,
          },
        },
      },
      include: mesaInclude,
    });
    return toMesaResponse(mesa);
  }

  async updateLink(
    mesaId: string,
    userId: string,
    dto: UpdateMesaLinkDto,
  ): Promise<MesaResponseDto> {
    const mesa = await this.findMesaDoDono(mesaId, userId);

    if (mesa.finalizada) {
      throw new ConflictException('Esta mesa já foi finalizada.');
    }

    const atualizada = await this.prisma.mesa.update({
      where: { id: mesaId },
      data: { linkPartida: dto.linkPartida },
      include: mesaInclude,
    });

    return toMesaResponse(atualizada);
  }

  async update(
    mesaId: string,
    userId: string,
    dto: UpdateMesaDto,
  ): Promise<MesaResponseDto> {
    const mesa = await this.findMesaDoDono(mesaId, userId);

    if (mesa.finalizada) {
      throw new ConflictException('Esta mesa já foi finalizada.');
    }

    const atualizada = await this.prisma.mesa.update({
      where: { id: mesaId },
      data: {
        dataHora: new Date(dto.dataHora),
        ...(dto.linkPartida !== undefined ? { linkPartida: dto.linkPartida } : {}),
        ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
      },
      include: mesaInclude,
    });

    return toMesaResponse(atualizada);
  }

  async fechar(mesaId: string, userId: string): Promise<MesaResponseDto> {
    const mesa = await this.findMesaDoDono(mesaId, userId);

    if (mesa.finalizada) {
      throw new ConflictException('Esta mesa já foi finalizada.');
    }

    const atualizada = await this.prisma.mesa.update({
      where: { id: mesaId },
      data: { finalizada: true, finalizadaEm: new Date() },
      include: mesaInclude,
    });

    return toMesaResponse(atualizada);
  }

  /**
   * Rotina de limpeza. Deleta:
   * - mesas finalizadas há mais de 1h (finalizadaEm < agora - 1h)
   * - mesas cuja data/hora marcada já passou de 24h (dataHora < agora - 24h)
   * Comparações em instante absoluto (UTC), o que respeita o fuso do horário salvo.
   */
  async limparMesasExpiradas(): Promise<number> {
    const agora = Date.now();
    const umaHoraAtras = new Date(agora - 60 * 60 * 1000);
    const vinteQuatroHorasAtras = new Date(agora - 24 * 60 * 60 * 1000);

    const { count } = await this.prisma.mesa.deleteMany({
      where: {
        OR: [
          { finalizada: true, finalizadaEm: { lt: umaHoraAtras } },
          { dataHora: { lt: vinteQuatroHorasAtras } },
        ],
      },
    });

    return count;
  }

  private async findMesaDoDono(mesaId: string, userId: string) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id: mesaId },
      include: mesaInclude,
    });

    if (!mesa) {
      throw new NotFoundException(`Mesa com id "${mesaId}" não encontrada.`);
    }

    if (mesa.criadorUserId !== userId) {
      throw new ForbiddenException('Apenas o dono da mesa pode alterá-la.');
    }

    return mesa;
  }

  async submitResultado(mesaId: string, dto: SubmitMesaResultadoDto): Promise<MesaResponseDto> {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id: mesaId },
      include: mesaInclude,
    });

    if (!mesa) {
      throw new NotFoundException(`Mesa com id "${mesaId}" não encontrada.`);
    }

    if (mesa.finalizada) {
      throw new ConflictException('Esta mesa já foi finalizada.');
    }

    const alocados = mesa.jogadores.map((j) => j.userId);
    const n = alocados.length;

    if (n === 0) {
      throw new BadRequestException('A mesa não possui jogadores alocados.');
    }

    this.validateResultado(dto, alocados, n);

    await this.prisma.$transaction(async (tx) => {
      await tx.mesa.update({
        where: { id: mesaId },
        data: {
          linkPartida: dto.linkPartida ?? mesa.linkPartida,
          finalizada: true,
          finalizadaEm: new Date(),
        },
      });

      for (const jogador of dto.jogadores) {
        await tx.mesaJogador.update({
          where: {
            mesaId_userId: {
              mesaId,
              userId: jogador.userId,
            },
          },
          data: {
            posicaoFinal: jogador.posicao,
            kills: jogador.kills,
          },
        });
      }

      await tx.eliminacao.createMany({
        data: dto.eliminacoes.map((e) => ({
          mesaId,
          eliminadorUserId: e.eliminadorUserId,
          eliminadoUserId: e.eliminadoUserId,
        })),
      });
    });

    const atualizada = await this.prisma.mesa.findUniqueOrThrow({
      where: { id: mesaId },
      include: mesaInclude,
    });

    return toMesaResponse(atualizada);
  }

  private validateResultado(
    dto: SubmitMesaResultadoDto,
    alocados: string[],
    n: number,
  ): void {
    const payloadUserIds = dto.jogadores.map((j) => j.userId);
    const payloadSet = new Set(payloadUserIds);
    const alocadosSet = new Set(alocados);

    if (payloadUserIds.length !== n || payloadSet.size !== n) {
      throw new BadRequestException(
        'A lista de jogadores deve conter exatamente os usuários alocados na mesa, sem duplicatas.',
      );
    }

    for (const userId of payloadUserIds) {
      if (!alocadosSet.has(userId)) {
        throw new BadRequestException(
          `O usuário "${userId}" não está alocado nesta mesa.`,
        );
      }
    }

    for (const userId of alocados) {
      if (!payloadSet.has(userId)) {
        throw new BadRequestException(
          `Falta o resultado do jogador "${userId}" alocado na mesa.`,
        );
      }
    }

    const posicoes = dto.jogadores.map((j) => j.posicao);
    const posicoesSet = new Set(posicoes);

    if (posicoesSet.size !== n) {
      throw new BadRequestException('As posições dos jogadores devem ser únicas.');
    }

    for (let i = 1; i <= n; i++) {
      if (!posicoesSet.has(i)) {
        throw new BadRequestException(
          `As posições devem cobrir 1..${n} sem lacunas.`,
        );
      }
    }

    if (dto.eliminacoes.length !== n - 1) {
      throw new BadRequestException(
        `A mesa com ${n} jogadores deve ter exatamente ${n - 1} eliminações.`,
      );
    }

    const eliminados = new Set<string>();

    for (const elim of dto.eliminacoes) {
      if (elim.eliminadorUserId === elim.eliminadoUserId) {
        throw new BadRequestException(
          'Um jogador não pode eliminar a si mesmo.',
        );
      }

      if (!alocadosSet.has(elim.eliminadorUserId) || !alocadosSet.has(elim.eliminadoUserId)) {
        throw new BadRequestException(
          'Eliminador e eliminado devem estar alocados na mesa.',
        );
      }

      if (eliminados.has(elim.eliminadoUserId)) {
        throw new BadRequestException(
          `O jogador "${elim.eliminadoUserId}" aparece como eliminado mais de uma vez.`,
        );
      }

      eliminados.add(elim.eliminadoUserId);
    }

    for (const jogador of dto.jogadores) {
      const killsEsperados = dto.eliminacoes.filter(
        (e) => e.eliminadorUserId === jogador.userId,
      ).length;

      if (jogador.kills !== killsEsperados) {
        throw new BadRequestException(
          `Kills do jogador "${jogador.userId}" (${jogador.kills}) não batem com as eliminações (${killsEsperados}).`,
        );
      }
    }
  }
}
