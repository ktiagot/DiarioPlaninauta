import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TorneioResultadoJogadorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all')
  inscricaoId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  posicao: number;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsInt()
  @Min(0)
  kills: number;
}

export class SubmitTorneioMesaResultadoDto {
  @ApiProperty({ type: [TorneioResultadoJogadorDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TorneioResultadoJogadorDto)
  jogadores: TorneioResultadoJogadorDto[];

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  empate?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  empatadosInscricaoIds?: string[];

  @ApiPropertyOptional({ example: 'https://twitch.tv/exemplo' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  linkPartida?: string;
}
