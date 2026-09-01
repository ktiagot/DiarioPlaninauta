import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemaResponseDto } from './dto/tema-response.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class TemaService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(): Promise<TemaResponseDto> {
    const cfg = await this.prisma.configuracaoTema.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });

    return {
      modo: cfg.modo,
      primary: cfg.primary,
      primaryStrong: cfg.primaryStrong,
      onPrimary: cfg.onPrimary,
      bg: cfg.bg,
      text: cfg.text,
    };
  }

  async atualizar(dto: UpdateTemaDto): Promise<TemaResponseDto> {
    const data = {
      modo: dto.modo,
      primary: dto.primary ?? undefined,
      primaryStrong: dto.primaryStrong ?? undefined,
      onPrimary: dto.onPrimary ?? undefined,
      bg: dto.bg ?? undefined,
      text: dto.text ?? undefined,
    };

    const cfg = await this.prisma.configuracaoTema.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    });

    return {
      modo: cfg.modo,
      primary: cfg.primary,
      primaryStrong: cfg.primaryStrong,
      onPrimary: cfg.onPrimary,
      bg: cfg.bg,
      text: cfg.text,
    };
  }
}
