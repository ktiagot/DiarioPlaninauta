import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { findCampeonatoAtual } from './campeonato-atual';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { GrupoResponseDto } from './dto/grupo-response.dto';

@Injectable()
export class GruposService {
  constructor(private readonly prisma: PrismaService) {}

  /** Grupos de um campeonato específico (uso admin). */
  async listarPorCampeonato(campeonatoId: string): Promise<GrupoResponseDto[]> {
    await this.assertCampeonatoExiste(campeonatoId);
    const grupos = await this.prisma.grupoCampeonato.findMany({
      where: { campeonatoId },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { inscricoes: true } } },
    });
    return grupos.map((g) => ({
      id: g.id,
      nome: g.nome,
      ordem: g.ordem,
      totalInscritos: g._count.inscricoes,
    }));
  }

  /** Grupos do campeonato atual (público — usado no formulário de inscrição). */
  async listarDoCampeonatoAtual(): Promise<GrupoResponseDto[]> {
    const campeonato = await findCampeonatoAtual(this.prisma, { publico: true });
    if (!campeonato || !campeonato.usaGrupos) return [];
    return this.listarPorCampeonato(campeonato.id);
  }

  async criar(campeonatoId: string, dto: CreateGrupoDto): Promise<GrupoResponseDto> {
    await this.assertCampeonatoExiste(campeonatoId);
    const nome = dto.nome.trim();

    const existente = await this.prisma.grupoCampeonato.findFirst({
      where: { campeonatoId, nome: { equals: nome, mode: 'insensitive' } },
    });
    if (existente) {
      throw new ConflictException('Já existe um grupo com esse nome neste campeonato.');
    }

    const grupo = await this.prisma.grupoCampeonato.create({
      data: { campeonatoId, nome, ordem: dto.ordem ?? 0 },
    });
    return { id: grupo.id, nome: grupo.nome, ordem: grupo.ordem, totalInscritos: 0 };
  }

  async atualizar(id: string, dto: UpdateGrupoDto): Promise<GrupoResponseDto> {
    const grupo = await this.findOrThrow(id);
    const nome = dto.nome?.trim();

    if (nome && nome.toLowerCase() !== grupo.nome.toLowerCase()) {
      const colisao = await this.prisma.grupoCampeonato.findFirst({
        where: {
          campeonatoId: grupo.campeonatoId,
          nome: { equals: nome, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (colisao) {
        throw new ConflictException('Já existe um grupo com esse nome neste campeonato.');
      }
    }

    const atualizado = await this.prisma.grupoCampeonato.update({
      where: { id },
      data: { nome: nome ?? undefined, ordem: dto.ordem ?? undefined },
      include: { _count: { select: { inscricoes: true } } },
    });
    return {
      id: atualizado.id,
      nome: atualizado.nome,
      ordem: atualizado.ordem,
      totalInscritos: atualizado._count.inscricoes,
    };
  }

  async remover(id: string): Promise<void> {
    const grupo = await this.prisma.grupoCampeonato.findUnique({
      where: { id },
      include: { _count: { select: { inscricoes: true } } },
    });
    if (!grupo) {
      throw new NotFoundException('Grupo não encontrado.');
    }
    if (grupo._count.inscricoes > 0) {
      throw new BadRequestException(
        'Não é possível remover um grupo com inscritos. Mova os inscritos antes.',
      );
    }
    await this.prisma.grupoCampeonato.delete({ where: { id } });
  }

  private async findOrThrow(id: string) {
    const grupo = await this.prisma.grupoCampeonato.findUnique({ where: { id } });
    if (!grupo) {
      throw new NotFoundException('Grupo não encontrado.');
    }
    return grupo;
  }

  private async assertCampeonatoExiste(campeonatoId: string): Promise<void> {
    const c = await this.prisma.campeonato.findUnique({ where: { id: campeonatoId } });
    if (!c) {
      throw new NotFoundException('Campeonato não encontrado.');
    }
  }
}
