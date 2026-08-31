import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMesaDto {
  @ApiProperty({ example: '2026-08-29T20:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  dataHora: string;

  @ApiPropertyOptional({ example: 'https://spelltable.wizards.com/game/abc123' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  linkPartida?: string;

  @ApiPropertyOptional({ example: 'Sexta 20h, cEDH, chamar no Discord.' })
  @IsOptional()
  @IsString()
  descricao?: string;
}
