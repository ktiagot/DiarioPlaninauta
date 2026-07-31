import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
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
}
