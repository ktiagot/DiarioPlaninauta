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
  dataHora: string;
  linkPartida: string | null;
  souMembro: boolean;
  finalizada: boolean;
  criadorUserId: string | null;
  quantidadeJogadores: number;
  jogadores: MesaJogador[];
}

export interface CreateMesaPayload {
  nome: string;
  dataHora: string;
  descricao?: string;
  linkPartida?: string;
}
