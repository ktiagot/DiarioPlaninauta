import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateRodadaDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  numero?: number;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsOptional()
  @IsDateString()
  dataRodada?: string;
}

export class ColocarJogadorMesaDto {
  @ApiProperty({ description: 'UUID da inscrição' })
  @IsUUID()
  inscricaoId: string;
}

export class AjustePontosDto {
  @ApiProperty({ example: -2, description: 'Pontos a somar (pode ser negativo)' })
  @IsInt()
  delta: number;

  @ApiProperty({ example: 'Penalidade por atraso' })
  @IsString()
  @MinLength(3, { message: 'Informe o motivo do ajuste.' })
  motivo: string;
}

export class AjustePontosResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() delta: number;
  @ApiProperty() motivo: string;
  @ApiProperty() adminUserId: string;
  @ApiProperty() createdAt: string;
}

export class UpdateInscricaoAdminDto {
  @ApiPropertyOptional({ nullable: true, description: 'null remove o grupo' })
  @IsOptional()
  @IsUUID()
  grupoId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  discordNick?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  deckUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  preconId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  preconComandanteId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  preconComandante2Id?: string | null;
}
