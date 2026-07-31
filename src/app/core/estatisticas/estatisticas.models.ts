export interface EstatisticasGerais {
  totalPartidas: number;
  totalJogadores: number;
  totalRodadas: number;
  totalDecks: number;
}

export interface MetagameDeck {
  deckNome: string;
  comandante: string;
  vezesUsado: number;
  vitorias: number;
  winRate: number;
}

export interface TopKiller {
  nick: string;
  totalKills: number;
}

export interface DeckUsado {
  deckNome: string;
  partidas: number;
  vitorias: number;
}

export interface MinhasEstatisticas {
  partidas: number;
  vitorias: number;
  kills: number;
  winRate: number;
  decksMaisUsados: DeckUsado[];
}

export interface EstatisticasResponse {
  gerais: EstatisticasGerais;
  metagame: MetagameDeck[];
  topKillers: TopKiller[];
  minhas?: MinhasEstatisticas | null;
}
