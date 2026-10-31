import { Injectable, NotFoundException } from '@nestjs/common';
import { Parceiro } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParceiroDto } from './dto/create-parceiro.dto';
import { UpdateParceiroDto } from './dto/update-parceiro.dto';
import { ParceiroResponseDto } from './dto/parceiro-response.dto';

@Injectable()
export class ParceirosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista pública: só parceiros ativos, ordenados. */
  async listarPublico(): Promise<ParceiroResponseDto[]> {
    const parceiros = await this.prisma.parceiro.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
    return parceiros.map(toResponse);
  }

  /** Lista admin: todos (ativos e inativos). */
  async listarAdmin(): Promise<ParceiroResponseDto[]> {
    const parceiros = await this.prisma.parceiro.findMany({
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
    return parceiros.map(toResponse);
  }

  async criar(dto: CreateParceiroDto): Promise<ParceiroResponseDto> {
    const parceiro = await this.prisma.parceiro.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        logoUrl: dto.logoUrl ?? null,
        url: dto.url,
        ativo: dto.ativo ?? true,
        ordem: dto.ordem ?? 0,
      },
    });
    return toResponse(parceiro);
  }

  async atualizar(id: string, dto: UpdateParceiroDto): Promise<ParceiroResponseDto> {
    await this.findOrThrow(id);
    const parceiro = await this.prisma.parceiro.update({
      where: { id },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        logoUrl: dto.logoUrl,
        url: dto.url,
        ativo: dto.ativo,
        ordem: dto.ordem,
      },
    });
    return toResponse(parceiro);
  }

  async remover(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.parceiro.delete({ where: { id } });
  }

  /** Incrementa o contador de cliques. Idempotente por natureza (só soma). */
  async registrarClique(id: string): Promise<void> {
    // updateMany não lança se o id não existir; mantém o endpoint silencioso.
    await this.prisma.parceiro.updateMany({
      where: { id, ativo: true },
      data: { cliques: { increment: 1 } },
    });
  }

  private async findOrThrow(id: string): Promise<Parceiro> {
    const parceiro = await this.prisma.parceiro.findUnique({ where: { id } });
    if (!parceiro) {
      throw new NotFoundException('Parceiro não encontrado.');
    }
    return parceiro;
  }
}

function toResponse(p: Parceiro): ParceiroResponseDto {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    logoUrl: p.logoUrl,
    url: p.url,
    ativo: p.ativo,
    ordem: p.ordem,
    cliques: p.cliques,
  };
}
