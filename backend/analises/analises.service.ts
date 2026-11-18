import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertApoiadorAtivo } from '../common/apoiador.util';
import { hojeRangeUtc } from '../common/date-range.util';
import { formatDataBr } from '../common/date-format.util';
import { ANALISE_VAGAS_PADRAO } from './analises.constants';
import {
  CreateAnaliseSessaoDto,
  InscreverAnaliseDto,
  UpdateAnaliseSessaoDto,
  UpdateInscricaoAnaliseDto,
} from './dto/analise.dto';
import {
  AnaliseInscricaoAdminDto,
  AnaliseSessaoResponseDto,
} from './dto/analise-response.dto';
import {
  analiseInclude,
  toAnaliseInscricoesAdmin,
  toAnaliseSessaoResponse,
} from './mappers/to-analise-response';

@Injectable()
export class AnalisesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- apoiador ----------

  async listar(userId: string): Promise<AnaliseSessaoResponseDto[]> {
    await assertApoiadorAtivo(this.prisma, userId);
    const sessoes = await this.prisma.analiseSessao.findMany({
      where: { aberta: true, dataHora: { gte: hojeRangeUtc().inicio } },
      orderBy: { dataHora: 'asc' },
      include: analiseInclude,
    });
    return sessoes.map((s) => toAnaliseSessaoResponse(s, userId));
  }

  async inscrever(
    userId: string,
    sessaoId: string,
    dto: InscreverAnaliseDto,
  ): Promise<AnaliseSessaoResponseDto> {
    await assertApoiadorAtivo(this.prisma, userId);
    const sessao = await this.findOrThrow(sessaoId);
    if (!sessao.aberta || sessao.dataHora < hojeRangeUtc().inicio) {
      throw new ConflictException('Esta data não está aberta para inscrições.');
    }

    try {
      await this.prisma.analiseInscricao.create({
        data: {
          sessaoId,
          userId,
          commander: dto.commander,
          linkDeck: dto.linkDeck,
          bracket: dto.bracket || null,
          budget: dto.budget,
          objetivos: dto.objetivos,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Você já está inscrito nesta data.');
      }
      throw err;
    }
    return this.getSessao(sessaoId, userId);
  }

  async atualizarMinha(
    userId: string,
    sessaoId: string,
    dto: UpdateInscricaoAnaliseDto,
  ): Promise<AnaliseSessaoResponseDto> {
    await assertApoiadorAtivo(this.prisma, userId);
    const sessao = await this.findOrThrow(sessaoId);
    if (sessao.dataHora < hojeRangeUtc().inicio) {
      throw new ConflictException('Esta data já passou.');
    }
    const { count } = await this.prisma.analiseInscricao.updateMany({
      where: { sessaoId, userId },
      data: {
        ...(dto.commander !== undefined && { commander: dto.commander }),
        ...(dto.linkDeck !== undefined && { linkDeck: dto.linkDeck }),
        ...(dto.bracket !== undefined && { bracket: dto.bracket || null }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.objetivos !== undefined && { objetivos: dto.objetivos }),
      },
    });
    if (count === 0) throw new NotFoundException('Você não está inscrito nesta data.');
    return this.getSessao(sessaoId, userId);
  }

  async cancelar(userId: string, sessaoId: string): Promise<void> {
    await this.findOrThrow(sessaoId);
    const antes = await this.confirmadosIds(sessaoId);
    const { count } = await this.prisma.analiseInscricao.deleteMany({
      where: { sessaoId, userId },
    });
    if (count === 0) throw new NotFoundException('Você não está inscrito nesta data.');
    await this.notificarPromovidos(sessaoId, antes);
  }

  // ---------- admin ----------

  async listarAdmin(): Promise<AnaliseSessaoResponseDto[]> {
    const sessoes = await this.prisma.analiseSessao.findMany({
      orderBy: { dataHora: 'desc' },
      include: analiseInclude,
    });
    return sessoes.map((s) => toAnaliseSessaoResponse(s));
  }

  async criar(dto: CreateAnaliseSessaoDto): Promise<AnaliseSessaoResponseDto> {
    const criada = await this.prisma.analiseSessao.create({
      data: {
        dataHora: new Date(dto.dataHora),
        titulo: dto.titulo || null,
        vagas: dto.vagas ?? ANALISE_VAGAS_PADRAO,
        aberta: dto.aberta ?? true,
        observacoes: dto.observacoes || null,
      },
    });
    return this.getSessao(criada.id);
  }

  async atualizar(
    id: string,
    dto: UpdateAnaliseSessaoDto,
  ): Promise<AnaliseSessaoResponseDto> {
    await this.findOrThrow(id);
    const antes = await this.confirmadosIds(id);
    await this.prisma.analiseSessao.update({
      where: { id },
      data: {
        ...(dto.dataHora !== undefined && { dataHora: new Date(dto.dataHora) }),
        ...(dto.titulo !== undefined && { titulo: dto.titulo || null }),
        ...(dto.vagas !== undefined && { vagas: dto.vagas }),
        ...(dto.aberta !== undefined && { aberta: dto.aberta }),
        ...(dto.observacoes !== undefined && { observacoes: dto.observacoes || null }),
      },
    });
    await this.notificarPromovidos(id, antes);
    return this.getSessao(id);
  }

  async remover(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.analiseSessao.delete({ where: { id } });
  }

  async listarInscricoesAdmin(sessaoId: string): Promise<AnaliseInscricaoAdminDto[]> {
    const sessao = await this.prisma.analiseSessao.findUnique({
      where: { id: sessaoId },
      include: analiseInclude,
    });
    if (!sessao) throw new NotFoundException('Data não encontrada.');
    return toAnaliseInscricoesAdmin(sessao);
  }

  async removerInscricaoAdmin(inscricaoId: string): Promise<void> {
    const inscricao = await this.prisma.analiseInscricao.findUnique({
      where: { id: inscricaoId },
      select: { sessaoId: true },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada.');
    const antes = await this.confirmadosIds(inscricao.sessaoId);
    await this.prisma.analiseInscricao.delete({ where: { id: inscricaoId } });
    await this.notificarPromovidos(inscricao.sessaoId, antes);
  }

  // ---------- internos ----------

  private async findOrThrow(id: string) {
    const sessao = await this.prisma.analiseSessao.findUnique({ where: { id } });
    if (!sessao) throw new NotFoundException('Data não encontrada.');
    return sessao;
  }

  private async getSessao(id: string, userId?: string): Promise<AnaliseSessaoResponseDto> {
    const sessao = await this.prisma.analiseSessao.findUniqueOrThrow({
      where: { id },
      include: analiseInclude,
    });
    return toAnaliseSessaoResponse(sessao, userId);
  }

  /** Quem está dentro das vagas (ordem de inscrição). */
  private async confirmadosIds(sessaoId: string): Promise<string[]> {
    const s = await this.prisma.analiseSessao.findUnique({
      where: { id: sessaoId },
      select: {
        vagas: true,
        inscricoes: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: { userId: true },
        },
      },
    });
    return s ? s.inscricoes.slice(0, s.vagas).map((i) => i.userId) : [];
  }

  /** Avisa quem saiu da lista de espera e entrou nas vagas. */
  private async notificarPromovidos(sessaoId: string, antes: string[]): Promise<void> {
    const [depois, sessao] = await Promise.all([
      this.confirmadosIds(sessaoId),
      this.prisma.analiseSessao.findUnique({
        where: { id: sessaoId },
        select: { dataHora: true },
      }),
    ]);
    const novos = depois.filter((id) => !antes.includes(id));
    if (!sessao || novos.length === 0) return;

    await this.prisma.notificacao.createMany({
      data: novos.map((userId) => ({
        userId,
        tipo: 'analise_vaga',
        titulo: 'Vaga na análise de deck',
        mensagem: `Abriu uma vaga e você saiu da lista de espera da análise de ${formatDataBr(sessao.dataHora)}.`,
      })),
    });
  }
}
