import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResultadoJogadorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  posicao: number;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsInt()
  @Min(0)
  kills: number;
}

export class ResultadoEliminacaoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  eliminadorUserId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  eliminadoUserId: string;
}

export class SubmitMesaResultadoDto {
  @ApiPropertyOptional({ example: 'https://twitch.tv/exemplo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  linkPartida?: string;

  @ApiProperty({ type: [ResultadoJogadorDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResultadoJogadorDto)
  jogadores: ResultadoJogadorDto[];

  @ApiProperty({ type: [ResultadoEliminacaoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultadoEliminacaoDto)
  eliminacoes: ResultadoEliminacaoDto[];
}
