import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EstatisticasGeraisDto {
  @ApiProperty({ example: 12, description: 'Total de mesas finalizadas' })
  totalPartidas: number;

  @ApiProperty({ example: 32, description: 'Total de inscrições ativas' })
  totalJogadores: number;

  @ApiProperty({ example: 3, description: 'Total de rodadas existentes' })
  totalRodadas: number;

  @ApiProperty({ example: 18, description: 'Total de decks distintos' })
  totalDecks: number;
}

export class MetagameDeckDto {
  @ApiProperty({ example: 'Precon Atraxa' })
  deckNome: string;

  @ApiProperty({ example: "Atraxa, Praetors' Voice" })
  comandante: string;

  @ApiProperty({ example: 5, description: 'Vezes que o deck foi usado' })
  vezesUsado: number;

  @ApiProperty({ example: 2, description: 'Vitórias (posicaoFinal === 1)' })
  vitorias: number;

  @ApiProperty({ example: 40.0, description: 'Win rate em porcentagem' })
  winRate: number;
}

export class TopKillerDto {
  @ApiProperty({ example: 'jogador123' })
  nick: string;

  @ApiProperty({ example: 8 })
  totalKills: number;
}

export class EstatisticasResponseDto {
  @ApiProperty({ type: EstatisticasGeraisDto })
  gerais: EstatisticasGeraisDto;

  @ApiProperty({ type: [MetagameDeckDto] })
  metagame: MetagameDeckDto[];

  @ApiProperty({ type: [TopKillerDto] })
  topKillers: TopKillerDto[];
}

export class DeckUsadoDto {
  @ApiProperty({ example: 'Precon Atraxa' })
  deckNome: string;

  @ApiProperty({ example: 3 })
  partidas: number;

  @ApiProperty({ example: 1 })
  vitorias: number;
}

export class MinhasEstatisticasDto {
  @ApiProperty({ example: 8 })
  partidas: number;

  @ApiProperty({ example: 3 })
  vitorias: number;

  @ApiProperty({ example: 5 })
  kills: number;

  @ApiProperty({ example: 37.5 })
  winRate: number;

  @ApiProperty({ type: [DeckUsadoDto] })
  decksMaisUsados: DeckUsadoDto[];
}

export class MinhasEstatisticasResponseDto {
  @ApiProperty({ type: MinhasEstatisticasDto })
  minhas: MinhasEstatisticasDto;
}

export class EstatisticasFullResponseDto {
  @ApiProperty({ type: EstatisticasGeraisDto })
  gerais: EstatisticasGeraisDto;

  @ApiProperty({ type: [MetagameDeckDto] })
  metagame: MetagameDeckDto[];

  @ApiProperty({ type: [TopKillerDto] })
  topKillers: TopKillerDto[];

  @ApiPropertyOptional({ type: MinhasEstatisticasDto, nullable: true })
  minhas?: MinhasEstatisticasDto | null;
}
