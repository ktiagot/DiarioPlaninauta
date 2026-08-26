import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreconDto, UpdatePreconDto } from './dto/create-precon.dto';
import {
  PreconComandanteResponseDto,
  PreconListItemDto,
  PreconResponseDto,
} from './dto/precon-response.dto';
import {
  toComandanteResponse,
  toPreconListItem,
  toPreconResponse,
} from './mappers/to-precon-response';

const preconInclude = {
  comandantes: { orderBy: { ordem: 'asc' as const } },
};

@Injectable()
export class PreconsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(busca?: string): Promise<PreconListItemDto[]> {
    const term = busca?.trim();
    const where = {
      banido: false,
      ...(term
        ? {
            OR: [
              { nome: { contains: term, mode: 'insensitive' as const } },
              { setNome: { contains: term, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const precons = await this.prisma.precon.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
    });

    return precons.map(toPreconListItem);
  }

  async listComandantes(preconId: string): Promise<PreconComandanteResponseDto[]> {
    const precon = await this.prisma.precon.findUnique({
      where: { id: preconId },
      include: { comandantes: { orderBy: { ordem: 'asc' } } },
    });

    if (!precon || precon.banido) {
      throw new NotFoundException('Precon não encontrado.');
    }

    return precon.comandantes.map(toComandanteResponse);
  }

  async listAdmin(): Promise<PreconResponseDto[]> {
    const precons = await this.prisma.precon.findMany({
      include: preconInclude,
      orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
    });

    return precons.map(toPreconResponse);
  }

  async create(dto: CreatePreconDto): Promise<PreconResponseDto> {
    const comandantes = this.normalizeComandantes(dto.comandantes);

    const precon = await this.prisma.precon.create({
      data: {
        nome: dto.nome,
        setNome: dto.setNome,
        cores: dto.cores,
        ano: dto.ano,
        comandantes: {
          create: comandantes.map((comandante, index) => ({
            comandante,
            ordem: index + 1,
          })),
        },
      },
      include: preconInclude,
    });

    return toPreconResponse(precon);
  }

  async update(id: string, dto: UpdatePreconDto): Promise<PreconResponseDto> {
    const existing = await this.prisma.precon.findUnique({
      where: { id },
      include: preconInclude,
    });

    if (!existing) {
      throw new NotFoundException('Precon não encontrado.');
    }

    if (dto.comandantes) {
      await this.syncComandantes(id, existing.comandantes, dto.comandantes);
    }

    const precon = await this.prisma.precon.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
        ...(dto.setNome !== undefined ? { setNome: dto.setNome } : {}),
        ...(dto.cores !== undefined ? { cores: dto.cores } : {}),
        ...(dto.ano !== undefined ? { ano: dto.ano } : {}),
        ...(dto.banido !== undefined ? { banido: dto.banido } : {}),
      },
      include: preconInclude,
    });

    return toPreconResponse(precon);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.precon.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Precon não encontrado.');
    }

    const [inscricoes, mesaJogadores] = await Promise.all([
      this.prisma.inscricao.count({ where: { preconId: id } }),
      this.prisma.mesaJogador.count({ where: { preconId: id } }),
    ]);

    if (inscricoes > 0 || mesaJogadores > 0) {
      throw new ConflictException(
        'Não é possível excluir: este precon está vinculado a inscrições ou mesas.',
      );
    }

    await this.prisma.precon.delete({ where: { id } });
  }

  async validateForInscricao(
    preconId: string,
    preconComandanteId: string,
  ): Promise<{ preconId: string; preconComandanteId: string }> {
    const precon = await this.prisma.precon.findUnique({
      where: { id: preconId },
      include: { comandantes: true },
    });

    if (!precon) {
      throw new BadRequestException('Precon inválido.');
    }

    if (precon.banido) {
      throw new BadRequestException('Este precon não está disponível para inscrição.');
    }

    const comandante = precon.comandantes.find((c) => c.id === preconComandanteId);
    if (!comandante) {
      throw new BadRequestException('Comandante inválido para o precon selecionado.');
    }

    return { preconId, preconComandanteId };
  }

  async validateOptionalForMesa(
    preconId?: string,
    preconComandanteId?: string,
  ): Promise<{ preconId: string | null; preconComandanteId: string | null }> {
    if (!preconId && !preconComandanteId) {
      return { preconId: null, preconComandanteId: null };
    }

    if (!preconId || !preconComandanteId) {
      throw new BadRequestException('Informe precon e comandante juntos, ou deixe ambos vazios.');
    }

    await this.validateForInscricao(preconId, preconComandanteId);
    return { preconId, preconComandanteId };
  }

  private normalizeComandantes(comandantes: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of comandantes) {
      const cmd = raw.trim();
      if (!cmd) continue;
      const key = cmd.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(cmd);
    }

    if (result.length === 0) {
      throw new BadRequestException('Informe ao menos um comandante.');
    }

    return result;
  }

  private async syncComandantes(
    preconId: string,
    existing: { id: string; comandante: string }[],
    incoming: string[],
  ): Promise<void> {
    const normalized = this.normalizeComandantes(incoming);
    const existingByName = new Map(
      existing.map((c) => [c.comandante.toLowerCase(), c]),
    );
    const incomingSet = new Set(normalized.map((c) => c.toLowerCase()));

    for (const cmd of existing) {
      if (!incomingSet.has(cmd.comandante.toLowerCase())) {
        const [inscricoes, mesaJogadores] = await Promise.all([
          this.prisma.inscricao.count({ where: { preconComandanteId: cmd.id } }),
          this.prisma.mesaJogador.count({ where: { preconComandanteId: cmd.id } }),
        ]);

        if (inscricoes > 0 || mesaJogadores > 0) {
          throw new ConflictException(
            `Não é possível remover o comandante "${cmd.comandante}": está em uso.`,
          );
        }

        await this.prisma.preconComandante.delete({ where: { id: cmd.id } });
      }
    }

    let ordem = 1;
    for (const comandante of normalized) {
      const found = existingByName.get(comandante.toLowerCase());
      if (found) {
        await this.prisma.preconComandante.update({
          where: { id: found.id },
          data: { ordem, comandante },
        });
      } else {
        await this.prisma.preconComandante.create({
          data: { preconId, comandante, ordem },
        });
      }
      ordem++;
    }
  }
}
