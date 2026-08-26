import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMesaDto {
  @ApiProperty({ example: 'Mesa casual — Sexta à Noite' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({ example: 'https://spelltable.com/...' })
  @IsOptional()
  @IsString()
  linkPartida?: string;

  @ApiPropertyOptional({ example: 'p0000001-0000-4000-8000-000000000001' })
  @IsOptional()
  @IsUUID()
  preconId?: string;

  @ApiPropertyOptional({ example: 'c0000001-0000-4000-8000-000000000001' })
  @IsOptional()
  @IsUUID()
  preconComandanteId?: string;
}
