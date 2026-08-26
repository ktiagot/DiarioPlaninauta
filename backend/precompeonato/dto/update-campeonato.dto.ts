import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCampeonatoDto {
  @ApiPropertyOptional({ example: 'Precompeonato #1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  nome?: string;

  @ApiPropertyOptional({ example: '#1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  edicao?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ example: 'Temporada 1' })
  @IsOptional()
  @IsString()
  descricao?: string;
}
