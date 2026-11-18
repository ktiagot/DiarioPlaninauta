import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAnaliseSessaoDto {
  @ApiProperty({ example: '2026-11-12T20:00:00-03:00' })
  @IsDateString()
  dataHora: string;

  @ApiPropertyOptional({ example: 'Análise de Commander - Novembro' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @ApiProperty({ example: 7, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  vagas: number;

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

export class UpdateAnaliseSessaoDto extends PartialType(CreateAnaliseSessaoDto) {}

export class InscreverAnaliseDto {
  @ApiProperty({ example: 'Jodah, the Unifier' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  commander: string;

  @ApiProperty({ example: 'https://moxfield.com/decks/abc' })
  @Transform(trim)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, { message: 'Informe o link do deck com https://.' })
  @MaxLength(300)
  linkDeck: string;

  @ApiPropertyOptional({ example: 'B3' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  bracket?: string;

  @ApiProperty({ example: 'Até R$ 500' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  budget: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  objetivos: string;
}

export class UpdateInscricaoAnaliseDto extends PartialType(InscreverAnaliseDto) {}
