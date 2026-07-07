export interface JogadorInscrito {
  id: number;
  ranking: number;
  nome: string;
  nickname?: string;
  comandante: string;
  deckNome: string;
  deckUrl?: string;
  meta: number;
  rodada?: number;
  mesa?: number;
}

export interface DeckFilterOption {
  nome: string;
  count: number;
}

/** Shape retornado pela API legacy (snake_case). */
export interface InscricaoApi {
  id: number;
  nome: string;
  nickname?: string;
  comandante?: string;
  comandante_principal?: string;
  deck_nome?: string;
  deck_url?: string;
  ranking?: number;
  ranking_campeonato?: number;
  pontos?: number;
  ativo?: boolean;
}
