export interface MinhasMesasJogador {
  nick: string;
  deckNome: string;
  posicaoFinal: number | null;
}

export interface MinhasMesa {
  id: string;
  rodadaNumero: number;
  numeroMesa: number;
  finalizada: boolean;
  minhaPosicaoFinal: number | null;
  jogadores: MinhasMesasJogador[];
}

export interface MinhasMesasResponse {
  mesas: MinhasMesa[];
}
