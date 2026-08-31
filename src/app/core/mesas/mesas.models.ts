export interface MesaJogador {
  userId: string;
  nick: string;
  nome: string;
  sobrenome: string;
  posicaoFinal: number | null;
  kills: number;
  deckNome?: string;
  comandante?: string;
}

export interface Mesa {
  id: string;
  nome: string;
  descricao: string | null;
  linkPartida: string | null;
  finalizada: boolean;
  criadorUserId: string | null;
  quantidadeJogadores: number;
  jogadores: MesaJogador[];
}

export interface CreateMesaPayload {
  nome: string;
  descricao?: string;
  linkPartida?: string;
  preconId?: string;
  preconComandanteId?: string;
}
