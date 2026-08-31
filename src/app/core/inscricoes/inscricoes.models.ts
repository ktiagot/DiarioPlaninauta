export interface JogadorInscrito {
  id: number;
  ranking: number;
  nome: string;
  nickname?: string;
  comandante: string;
  deckNome: string;
  deckUrl?: string;
  meta: number;
  pontos: number;
  eliminacoes: number;
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

export interface CreateInscricaoPayload {
  preconId: string;
  preconComandanteId: string;
  preconComandante2Id?: string;
  aceiteTermos: boolean;
  aceitePrivacidade: boolean;
  entrouDiscord: boolean;
}

export interface CreateInscricaoResponse {
  id: string;
  campeonatoId: string;
  email: string;
  discordNick: string;
  deckUrl: string | null;
  deckNome: string;
  comandante: string;
  nome: string;
  nick: string;
}
