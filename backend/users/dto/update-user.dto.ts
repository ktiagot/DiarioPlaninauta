import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsInt, IsNumber, Min } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

class UpdateUserStatsDto {
  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(0)
  partidas?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  vitorias?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  eliminacoes?: number;

  @ApiPropertyOptional({ example: 71.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  winRate?: number;

  @ApiPropertyOptional({ example: 1250.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pontosTotais?: number;

  @ApiPropertyOptional({ example: [1, 2, 3], type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  melhoresResultados?: number[];

  @ApiPropertyOptional({ example: 'silver' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ example: 'champion' })
  @IsOptional()
  @IsString()
  badge?: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {
  // Stats fields (not present in creation, updateable later)
  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(0)
  partidas?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  vitorias?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  eliminacoes?: number;

  @ApiPropertyOptional({ example: 71.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  winRate?: number;

  @ApiPropertyOptional({ example: 1250.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pontosTotais?: number;

  @ApiPropertyOptional({ example: [1, 2, 3], type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  melhoresResultados?: number[];
}
