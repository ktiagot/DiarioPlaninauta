import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MesaoTipo } from '@prisma/client';
import {
  MESAO_VAGAS_JOGADOR_PADRAO,
  MESAO_VAGAS_SUPLENTE_PADRAO,
} from '../mesao-live.constants';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMesaoSessaoDto {
  @ApiProperty({ example: '2026-11-10T20:00:00-03:00' })
  @IsDateString()
  dataHora: string;

  @ApiPropertyOptional({ example: 'Mesão 1' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @ApiPropertyOptional({ example: 'Bracket 3' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  bracket?: string;

  @ApiPropertyOptional({ default: MESAO_VAGAS_JOGADOR_PADRAO })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  vagasJogador?: number;

  @ApiPropertyOptional({ default: MESAO_VAGAS_SUPLENTE_PADRAO })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  vagasSuplente?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  aberta?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}

export class UpdateMesaoSessaoDto extends PartialType(CreateMesaoSessaoDto) {}

export class InscreverMesaoDto {
  @ApiProperty({ enum: MesaoTipo })
  @IsEnum(MesaoTipo)
  tipo: MesaoTipo;
}
