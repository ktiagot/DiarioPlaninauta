import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Campeonato, CampeonatoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BannerStorage } from './banner-storage';
import { CAMPEONATO_STATUS_LABEL } from './constants/status-labels';
import { parseDateOnly, toDateOnly } from './date-only';
import { CampeonatoAdminResponseDto } from './dto/campeonato-admin-response.dto';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto } from './dto/update-campeonato.dto';

const TRANSICOES: Record<CampeonatoStatus, CampeonatoStatus[]> = {
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly bannerStorage: BannerStorage,
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
        status: CampeonatoStatus.INSCRICOES_ABERTAS,
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
    return toAdminResponse(updated);
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
