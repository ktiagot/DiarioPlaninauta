import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MesaoTipo, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertApoiadorAtivo } from '../common/apoiador.util';
import { mesRangeUtc } from '../common/date-range.util';
import {
  CreateMesaoSessaoDto,
  InscreverMesaoDto,
  UpdateMesaoSessaoDto,
} from './dto/mesao-live.dto';
import {
  MesaoInscricaoAdminDto,
  MesaoSessaoResponseDto,
} from './dto/mesao-live-response.dto';
import {
  MESAO_MAX_JOGADOR_POR_MES,
  MESAO_MAX_SUPLENTE_POR_MES,
  MESAO_VAGAS_JOGADOR_PADRAO,
  MESAO_VAGAS_SUPLENTE_PADRAO,
} from './mesao-live.constants';
import {
  mesaoInclude,
  toMesaoInscricoesAdmin,
  toMesaoSessaoResponse,
} from './mappers/to-mesao-response';

@Injectable()
export class MesaoLiveService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- apoiador ----------

  async listar(userId: string): Promise<MesaoSessaoResponseDto[]> {
    await assertApoiadorAtivo(this.prisma, userId);
    const sessoes = await this.prisma.mesaoSessao.findMany({
      where: { aberta: true, dataHora: { gt: new Date() } },
      orderBy: { dataHora: 'asc' },
      include: mesaoInclude,
    });
    return sessoes.map((s) => toMesaoSessaoResponse(s, userId));
  }

  /**
   * Inscreve como jogador ou suplente. Se já houver inscrição na data com o outro tipo,
   * troca o tipo (e vai para o fim da fila do novo tipo).
   */
  async inscrever(
    userId: string,
    sessaoId: string,
    dto: InscreverMesaoDto,
  ): Promise<MesaoSessaoResponseDto> {
    await assertApoiadorAtivo(this.prisma, userId);

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const sessao = await tx.mesaoSessao.findUnique({ where: { id: sessaoId } });
          if (!sessao) throw new NotFoundException('Data não encontrada.');
          if (!sessao.aberta || sessao.dataHora <= new Date()) {
            throw new ConflictException('Esta data não está aberta para inscrições.');
          }

          const existente = await tx.mesaoInscricao.findUnique({
            where: { sessaoId_userId: { sessaoId, userId } },
          });
          if (existente?.tipo === dto.tipo) {
            throw new ConflictException('Você já está inscrito nesta data com esse tipo.');
          }

          const ehJogador = dto.tipo === MesaoTipo.JOGADOR;
          const limiteMes = ehJogador ? MESAO_MAX_JOGADOR_POR_MES : MESAO_MAX_SUPLENTE_POR_MES;
          const { inicio, fim } = mesRangeUtc(sessao.dataHora);
          const noMes = await tx.mesaoInscricao.count({
            where: {
              userId,
              tipo: dto.tipo,
              sessao: { dataHora: { gte: inicio, lt: fim } },
              ...(existente && { id: { not: existente.id } }),
            },
          });
          if (noMes >= limiteMes) {
            throw new ConflictException(
              ehJogador
                ? `Você já está como jogador em uma data deste mês (máximo ${MESAO_MAX_JOGADOR_POR_MES}).`
                : `Você já está como suplente em ${MESAO_MAX_SUPLENTE_POR_MES} datas deste mês.`,
            );
          }

          const ocupadas = await tx.mesaoInscricao.count({
            where: { sessaoId, tipo: dto.tipo },
          });
          const vagas = ehJogador ? sessao.vagasJogador : sessao.vagasSuplente;
          if (ocupadas >= vagas) {
            throw new ConflictException(
              ehJogador ? 'Não há mais vagas de jogador nesta data.' : 'Não há mais vagas de suplente nesta data.',
            );
          }

          if (existente) {
            await tx.mesaoInscricao.update({
              where: { id: existente.id },
              data: { tipo: dto.tipo, createdAt: new Date() },
            });
          } else {
            await tx.mesaoInscricao.create({ data: { sessaoId, userId, tipo: dto.tipo } });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(err.code)) {
        throw new ConflictException('Houve um conflito de inscrição. Tente novamente.');
      }
      throw err;
    }
    return this.getSessao(sessaoId, userId);
  }

  async cancelar(userId: string, sessaoId: string): Promise<void> {
    const { count } = await this.prisma.mesaoInscricao.deleteMany({
      where: { sessaoId, userId },
    });
    if (count === 0) throw new NotFoundException('Você não está inscrito nesta data.');
  }

  // ---------- admin ----------

  async listarAdmin(): Promise<MesaoSessaoResponseDto[]> {
    const sessoes = await this.prisma.mesaoSessao.findMany({
      orderBy: { dataHora: 'desc' },
      include: mesaoInclude,
    });
    return sessoes.map((s) => toMesaoSessaoResponse(s));
  }

  async criar(dto: CreateMesaoSessaoDto): Promise<MesaoSessaoResponseDto> {
    const criada = await this.prisma.mesaoSessao.create({
      data: {
        dataHora: new Date(dto.dataHora),
        titulo: dto.titulo || null,
        bracket: dto.bracket || null,
        vagasJogador: dto.vagasJogador ?? MESAO_VAGAS_JOGADOR_PADRAO,
        vagasSuplente: dto.vagasSuplente ?? MESAO_VAGAS_SUPLENTE_PADRAO,
        aberta: dto.aberta ?? true,
        observacoes: dto.observacoes || null,
      },
    });
    return this.getSessao(criada.id);
  }

  async atualizar(id: string, dto: UpdateMesaoSessaoDto): Promise<MesaoSessaoResponseDto> {
    await this.findOrThrow(id);
    await this.prisma.mesaoSessao.update({
      where: { id },
      data: {
        ...(dto.dataHora !== undefined && { dataHora: new Date(dto.dataHora) }),
        ...(dto.titulo !== undefined && { titulo: dto.titulo || null }),
        ...(dto.bracket !== undefined && { bracket: dto.bracket || null }),
        ...(dto.vagasJogador !== undefined && { vagasJogador: dto.vagasJogador }),
        ...(dto.vagasSuplente !== undefined && { vagasSuplente: dto.vagasSuplente }),
        ...(dto.aberta !== undefined && { aberta: dto.aberta }),
        ...(dto.observacoes !== undefined && { observacoes: dto.observacoes || null }),
      },
    });
    return this.getSessao(id);
  }

  async remover(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.mesaoSessao.delete({ where: { id } });
  }

  async listarInscricoesAdmin(sessaoId: string): Promise<MesaoInscricaoAdminDto[]> {
    const sessao = await this.prisma.mesaoSessao.findUnique({
      where: { id: sessaoId },
      include: mesaoInclude,
    });
    if (!sessao) throw new NotFoundException('Data não encontrada.');
    return toMesaoInscricoesAdmin(sessao);
  }

  async removerInscricaoAdmin(inscricaoId: string): Promise<void> {
    const { count } = await this.prisma.mesaoInscricao.deleteMany({
      where: { id: inscricaoId },
    });
    if (count === 0) throw new NotFoundException('Inscrição não encontrada.');
  }

  // ---------- internos ----------

  private async findOrThrow(id: string) {
    const sessao = await this.prisma.mesaoSessao.findUnique({ where: { id } });
    if (!sessao) throw new NotFoundException('Data não encontrada.');
    return sessao;
  }

  private async getSessao(id: string, userId?: string): Promise<MesaoSessaoResponseDto> {
    const sessao = await this.prisma.mesaoSessao.findUniqueOrThrow({
      where: { id },
      include: mesaoInclude,
    });
    return toMesaoSessaoResponse(sessao, userId);
  }
}
