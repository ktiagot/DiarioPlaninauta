import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMesaDto {
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
