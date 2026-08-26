import { ConflictException, Injectable } from '@nestjs/common';
import { Campeonato, CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CAMPEONATO_STATUS_LABEL } from './constants/status-labels';
import { parseDateOnly, toDateOnly } from './date-only';
import { CampeonatoAdminResponseDto } from './dto/campeonato-admin-response.dto';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';

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
  constructor(private readonly prisma: PrismaService) {}

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
}
