import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RodadaAtualJogadorDto {
  @ApiProperty()
  inscricaoId: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  nickname?: string;

  @ApiPropertyOptional()
  comandante?: string;

  @ApiPropertyOptional()
  deckNome?: string;

  @ApiPropertyOptional({ nullable: true })
  deckUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  rankingCampeonato?: number | null;

  @ApiPropertyOptional({ nullable: true })
  posicaoFinal?: number | null;

  @ApiProperty()
  kills: number;
}

export class RodadaAtualMesaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numeroMesa: number;

  @ApiProperty()
  finalizada: boolean;

  @ApiPropertyOptional({ nullable: true })
  linkPartida?: string | null;

  @ApiProperty()
  empate: boolean;

  @ApiProperty({ type: [String] })
  empatadosInscricaoIds: string[];

  @ApiProperty({ type: [RodadaAtualJogadorDto] })
  jogadores: RodadaAtualJogadorDto[];
}

export class RodadaAtualDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: number;

  @ApiProperty()
  dataRodada: string;

  @ApiProperty()
  ativa: boolean;

  @ApiProperty()
  finalizada: boolean;

  @ApiProperty()
  podeFinalizar: boolean;

  @ApiProperty({ type: [RodadaAtualMesaDto] })
  mesas: RodadaAtualMesaDto[];
}
