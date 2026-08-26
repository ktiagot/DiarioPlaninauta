import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCampeonatoDto {
  @ApiProperty({ example: 'Precompeonato #1' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({ example: '#1' })
  @IsString()
  @MinLength(1)
  edicao: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  dataInicio: string;

  @ApiPropertyOptional({ example: 'Temporada 1' })
  @IsOptional()
  @IsString()
  descricao?: string;
}
