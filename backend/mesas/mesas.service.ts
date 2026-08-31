import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from '../precons/precons.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
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

/** Capacidade máxima de uma mesa casual (contando o dono). */
const MAX_JOGADORES = 4;

// Fuso fixo do projeto: UTC-3 (America/Sao_Paulo, sem horário de verão).
const TZ_OFFSET_MIN = -180;

/**
 * Intervalo [início, fim] do dia de hoje em UTC-3, expresso em instantes UTC.
 * Ex.: hoje 00:00:00 (UTC-3) e hoje 23:59:59.999 (UTC-3).
 */
export function hojeRangeUtc(now: Date = new Date()): { inicio: Date; fim: Date } {
  const localMs = now.getTime() + TZ_OFFSET_MIN * 60 * 1000;
  const local = new Date(localMs);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const inicioLocalUtcMs = Date.UTC(y, m, d, 0, 0, 0, 0);
  const inicio = new Date(inicioLocalUtcMs - TZ_OFFSET_MIN * 60 * 1000);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { inicio, fim };
}

@Injectable()
export class MesasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preconsService: PreconsService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async findAll(viewerUserId?: string): Promise<MesaResponseDto[]> {
    const mesas = await this.prisma.mesa.findMany({
      include: mesaInclude,
      orderBy: { createdAt: 'asc' },
    });

    return mesas.map((m) => toMesaResponse(m, viewerUserId));
  }

  async entrar(mesaId: string, userId: string): Promise<MesaResponseDto> {
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
    if (mesa.jogadores.some((j) => j.userId === userId)) {
      throw new ConflictException('Você já está nesta mesa.');
    }
    if (mesa.jogadores.length >= MAX_JOGADORES) {
      throw new ConflictException(`A mesa já está cheia (máximo ${MAX_JOGADORES} jogadores).`);
    }

    await this.prisma.mesaJogador.create({
      data: { mesaId, userId },
    });

    await this.notificarEntradaNaMesa(mesa, userId);

    return this.retornarMesa(mesaId, userId);
  }

  /**
   * Notifica o dono e os demais participantes (exceto quem acabou de entrar)
   * que um novo jogador entrou na mesa.
   * `mesa` é o estado ANTES da entrada (não contém o novo jogador).
   */
  private async notificarEntradaNaMesa(
    mesa: { id: string; nome: string; criadorUserId: string | null; jogadores: { userId: string }[] },
    novoUserId: string,
  ): Promise<void> {
    const novoUser = await this.prisma.user.findUnique({
      where: { id: novoUserId },
      select: { nick: true },
    });
    const nick = novoUser?.nick ?? 'Alguém';

    // Destinatários: dono + participantes já presentes, sem duplicatas e sem quem entrou.
    const destinatarios = new Set<string>();
    if (mesa.criadorUserId) destinatarios.add(mesa.criadorUserId);
    for (const j of mesa.jogadores) destinatarios.add(j.userId);
    destinatarios.delete(novoUserId);

    if (destinatarios.size === 0) return;

    await this.prisma.notificacao.createMany({
      data: [...destinatarios].map((uid) => ({
        userId: uid,
        tipo: 'mesa_entrou',
        titulo: 'Novo jogador na mesa',
        mensagem: `${nick} entrou na mesa "${mesa.nome}".`,
      })),
    });
  }

  async sair(mesaId: string, userId: string): Promise<MesaResponseDto> {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id: mesaId },
      include: mesaInclude,
    });

    if (!mesa) {
      throw new NotFoundException(`Mesa com id "${mesaId}" não encontrada.`);
    }
    if (mesa.criadorUserId === userId) {
      throw new ConflictException(
        'O dono não pode sair da mesa. Apague a mesa se quiser encerrá-la.',
      );
    }
    const participa = mesa.jogadores.some((j) => j.userId === userId);
    if (!participa) {
      throw new ConflictException('Você não está nesta mesa.');
    }

    await this.prisma.mesaJogador.delete({
      where: { mesaId_userId: { mesaId, userId } },
    });

    return this.retornarMesa(mesaId, userId);
  }

  async removerJogador(
    mesaId: string,
    donoUserId: string,
    alvoUserId: string,
  ): Promise<MesaResponseDto> {
    const mesa = await this.findMesaDoDono(mesaId, donoUserId);

    if (alvoUserId === mesa.criadorUserId) {
      throw new ConflictException('O dono não pode ser removido da própria mesa.');
    }
    if (!mesa.jogadores.some((j) => j.userId === alvoUserId)) {
      throw new NotFoundException('Este jogador não está na mesa.');
    }

    await this.prisma.mesaJogador.delete({
      where: { mesaId_userId: { mesaId, userId: alvoUserId } },
    });

    return this.retornarMesa(mesaId, donoUserId);
  }

  async apagar(mesaId: string, userId: string): Promise<void> {
    await this.findMesaDoDono(mesaId, userId);
    // Cascade remove jogadores e eliminações.
    await this.prisma.mesa.delete({ where: { id: mesaId } });
  }

  private async retornarMesa(mesaId: string, viewerUserId: string): Promise<MesaResponseDto> {
    const mesa = await this.prisma.mesa.findUniqueOrThrow({
      where: { id: mesaId },
      include: mesaInclude,
    });
    return toMesaResponse(mesa, viewerUserId);
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
    return toMesaResponse(mesa, userId);
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

    return toMesaResponse(atualizada, userId);
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

    return toMesaResponse(atualizada, userId);
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

    return toMesaResponse(atualizada, userId);
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

  /**
   * Notifica os jogadores de mesas casuais (não finalizadas) cujo dia (em UTC-3)
   * é hoje. Chamado por um cron diário. Retorna quantas notificações foram criadas.
   */
  async notificarMesasDeHoje(): Promise<number> {
    const { inicio, fim } = hojeRangeUtc();

    const mesas = await this.prisma.mesa.findMany({
      where: {
        finalizada: false,
        dataHora: { gte: inicio, lte: fim },
      },
      include: { jogadores: { select: { userId: true } } },
    });

    const dados = mesas.flatMap((mesa) => {
      const hora = mesa.dataHora.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      });
      return mesa.jogadores.map((j) => ({
        userId: j.userId,
        tipo: 'dia_do_evento',
        titulo: 'Sua mesa é hoje!',
        mensagem: `A mesa "${mesa.nome}" acontece hoje às ${hora}.`,
      }));
    });

    if (dados.length === 0) return 0;

    const { count } = await this.prisma.notificacao.createMany({ data: dados });
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
