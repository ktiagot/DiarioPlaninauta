import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Campeonato, CampeonatoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { BannerStorage } from './banner-storage';
import { CAMPEONATO_STATUS_LABEL } from './constants/status-labels';
import { parseDateOnly, toDateOnly } from './date-only';
import { CampeonatoAdminResponseDto } from './dto/campeonato-admin-response.dto';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto } from './dto/update-campeonato.dto';

const TRANSICOES: Record<CampeonatoStatus, CampeonatoStatus[]> = {
  RASCUNHO: [CampeonatoStatus.INSCRICOES_ABERTAS, CampeonatoStatus.ENCERRADO],
  INSCRICOES_ABERTAS: [CampeonatoStatus.EM_ANDAMENTO, CampeonatoStatus.ENCERRADO],
  EM_ANDAMENTO: [CampeonatoStatus.INSCRICOES_ABERTAS, CampeonatoStatus.ENCERRADO],
  ENCERRADO: [],
};

export function toAdminResponse(c: Campeonato): CampeonatoAdminResponseDto {
  return {
    id: c.id,
    nome: c.nome,
    edicao: c.edicao,
    dataInicio: toDateOnly(c.dataInicio),
    descricao: c.descricao ?? null,
    bannerUrl: c.bannerUrl ?? null,
    status: CAMPEONATO_STATUS_LABEL[c.status],
    statusCode: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class CampeonatoAdminService {
  private readonly logger = new Logger(CampeonatoAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bannerStorage: BannerStorage,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async list(): Promise<CampeonatoAdminResponseDto[]> {
    const campeonatos = await this.prisma.campeonato.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return campeonatos.map(toAdminResponse);
  }

  async create(dto: CreateCampeonatoDto): Promise<CampeonatoAdminResponseDto> {
    const ativo = await this.prisma.campeonato.findFirst({
      where: { status: { not: CampeonatoStatus.ENCERRADO } },
    });

    if (ativo) {
      throw new ConflictException(
        'Já existe um campeonato em andamento. Finalize-o antes de criar o próximo.',
      );
    }

    const campeonato = await this.prisma.campeonato.create({
      data: {
        nome: dto.nome,
        edicao: dto.edicao,
        dataInicio: parseDateOnly(dto.dataInicio),
        descricao: dto.descricao ?? null,
        status: CampeonatoStatus.RASCUNHO,
      },
    });

    return toAdminResponse(campeonato);
  }

  private async findOrThrow(id: string): Promise<Campeonato> {
    const campeonato = await this.prisma.campeonato.findUnique({ where: { id } });
    if (!campeonato) {
      throw new NotFoundException('Campeonato não encontrado.');
    }
    return campeonato;
  }

  async update(id: string, dto: UpdateCampeonatoDto): Promise<CampeonatoAdminResponseDto> {
    const campeonato = await this.findOrThrow(id);

    if (campeonato.status === CampeonatoStatus.ENCERRADO) {
      throw new ConflictException('Campeonato encerrado não pode ser editado.');
    }

    const data: Prisma.CampeonatoUpdateInput = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.edicao !== undefined) data.edicao = dto.edicao;
    if (dto.dataInicio !== undefined) data.dataInicio = parseDateOnly(dto.dataInicio);
    if (dto.descricao !== undefined) data.descricao = dto.descricao;

    const updated = await this.prisma.campeonato.update({ where: { id }, data });
    return toAdminResponse(updated);
  }

  async updateStatus(
    id: string,
    status: CampeonatoStatus,
  ): Promise<CampeonatoAdminResponseDto> {
    const campeonato = await this.findOrThrow(id);

    if (!TRANSICOES[campeonato.status].includes(status)) {
      throw new ConflictException('Transição de status inválida.');
    }

    const updated = await this.prisma.campeonato.update({
      where: { id },
      data: { status },
    });

    // Publicação: rascunho -> inscrições abertas notifica todos os usuários.
    if (
      campeonato.status === CampeonatoStatus.RASCUNHO &&
      status === CampeonatoStatus.INSCRICOES_ABERTAS
    ) {
      await this.notificarCampeonatoPublicado(updated);
    }

    // Encerramento: em andamento -> encerrado notifica os inscritos ativos.
    if (
      campeonato.status === CampeonatoStatus.EM_ANDAMENTO &&
      status === CampeonatoStatus.ENCERRADO
    ) {
      await this.notificarCampeonatoEncerrado(updated);
    }

    return toAdminResponse(updated);
  }

  /** Notifica os inscritos ativos que o campeonato foi encerrado. Best-effort. */
  private async notificarCampeonatoEncerrado(campeonato: Campeonato): Promise<void> {
    try {
      const inscricoes = await this.prisma.inscricao.findMany({
        where: { campeonatoId: campeonato.id, ativo: true },
        select: { userId: true },
      });
      const userIds = [...new Set(inscricoes.map((i) => i.userId))];
      if (userIds.length === 0) return;

      await this.prisma.notificacao.createMany({
        data: userIds.map((userId) => ({
          userId,
          tipo: 'campeonato_encerrado',
          titulo: 'Campeonato encerrado',
          mensagem: `O "${campeonato.nome} — ${campeonato.edicao}" foi encerrado. Confira a classificação final!`,
        })),
      });
    } catch (err) {
      this.logger.error('Falha ao notificar campeonato encerrado.', err as Error);
    }
  }

  /** Notifica todos os usuários que um novo campeonato foi publicado. Best-effort. */
  private async notificarCampeonatoPublicado(campeonato: Campeonato): Promise<void> {
    try {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      if (users.length === 0) return;

      await this.prisma.notificacao.createMany({
        data: users.map((u) => ({
          userId: u.id,
          tipo: 'campeonato_novo',
          titulo: 'Novo campeonato aberto',
          mensagem: `As inscrições para "${campeonato.nome} — ${campeonato.edicao}" estão abertas!`,
        })),
      });
    } catch (err) {
      this.logger.error('Falha ao notificar campeonato publicado.', err as Error);
    }
  }

  async updateBanner(
    id: string,
    file: { mimetype: string; buffer: Buffer; size: number },
  ): Promise<CampeonatoAdminResponseDto> {
    const campeonato = await this.findOrThrow(id);

    if (campeonato.status === CampeonatoStatus.ENCERRADO) {
      throw new ConflictException('Campeonato encerrado não pode ser editado.');
    }

    const bannerUrl = await this.bannerStorage.save(id, file);
    const updated = await this.prisma.campeonato.update({
      where: { id },
      data: { bannerUrl },
    });
    return toAdminResponse(updated);
  }
}
