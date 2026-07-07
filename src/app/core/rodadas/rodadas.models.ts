export interface Rodada {
  id: number;
  numero: number;
  dataRodada: string;
  mesas: Mesa[];
}

export interface Mesa {
  id: number;
  numeroMesa: number;
  finalizada: boolean;
  linkPartida?: string;
  vencedorId?: number;
  segundoId?: number;
  eliminacoes?: EliminacaoRegistro[];
  jogadores: MesaJogador[];
}

export interface MesaJogador {
  inscricaoId: number;
  nome: string;
  nickname?: string;
  comandante?: string;
  deckNome?: string;
  deckUrl?: string;
  rankingCampeonato?: number;
  posicaoFinal?: number;
  kills?: number;
}

export interface EliminacaoRegistro {
  eliminadorInscricaoId: number;
  eliminadoInscricaoId: number;
}

export interface ConfirmarPosicoesPayload {
  jogadores: { inscricaoId: number; posicao: number; kills: number }[];
  eliminacoes: EliminacaoRegistro[];
  linkPartida?: string;
}

export interface SalvarLinkPayload {
  linkPartida: string;
}

/** Shape retornado pela API legacy (snake_case). */
export interface RodadaApi {
  id: number;
  numero: number;
  data_rodada: string;
  mesas?: MesaApi[];
}

export interface MesaApi {
  id: number;
  numero_mesa: number;
  finalizada: boolean;
  link_partida?: string;
  link_jogo?: string;
  vencedor_id?: number;
  segundo_id?: number;
  jogadores?: MesaJogadorApi[];
}

export interface MesaJogadorApi {
  id?: number;
  inscricao_id?: number;
  nome: string;
  nickname?: string;
  comandante?: string;
  comandante_principal?: string;
  deck_nome?: string;
  deck_url?: string;
  ranking?: number;
  ranking_campeonato?: number;
  posicao_final?: number;
}
