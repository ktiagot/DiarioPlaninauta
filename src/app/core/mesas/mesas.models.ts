export interface MesaJogador {
  userId: string;
  nick: string;
  nome: string;
  sobrenome: string;
  posicaoFinal: number | null;
  kills: number;
}

export interface Mesa {
  id: string;
  nome: string;
  linkPartida: string | null;
  finalizada: boolean;
  quantidadeJogadores: number;
  jogadores: MesaJogador[];
}

export interface CreateMesaPayload {
  nome: string;
  linkPartida?: string;
}
