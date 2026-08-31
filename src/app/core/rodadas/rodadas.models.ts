export interface Rodada {

  id: string;

  numero: number;

  dataRodada: string;

  ativa?: boolean;

  finalizada?: boolean;

  podeFinalizar?: boolean;

  mesas: Mesa[];

}



export interface Mesa {

  id: string;

  numeroMesa: number;

  finalizada: boolean;

  validada: boolean;

  validadaEm?: string | null;

  linkPartida?: string;

  empate?: boolean;

  empatadosInscricaoIds?: string[];

  vencedorId?: string;

  segundoId?: string;

  eliminacoes?: EliminacaoRegistro[];

  jogadores: MesaJogador[];

}



export interface MesaJogador {

  inscricaoId: string;

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

  eliminadorInscricaoId: string;

  eliminadoInscricaoId: string;

}



export interface ConfirmarPosicoesPayload {

  jogadores: { inscricaoId: string; posicao: number; kills: number }[];

  empate: boolean;

  empatadosInscricaoIds: string[];

  linkPartida?: string;

}



export interface SalvarLinkPayload {

  linkPartida: string;

}



/** Shape da API Nest `GET /precompeonato/atual/rodada`. */

export interface RodadaAtualApi {

  id: string;

  numero: number;

  dataRodada: string;

  ativa: boolean;

  finalizada: boolean;

  podeFinalizar: boolean;

  mesas: MesaAtualApi[];

}



export interface MesaAtualApi {

  id: string;

  numeroMesa: number;

  finalizada: boolean;

  validada: boolean;

  validadaEm?: string | null;

  linkPartida?: string | null;

  empate: boolean;

  empatadosInscricaoIds: string[];

  jogadores: MesaJogadorAtualApi[];

}



export interface MesaJogadorAtualApi {

  inscricaoId: string;

  nome: string;

  nickname?: string;

  comandante?: string;

  deckNome?: string;

  deckUrl?: string | null;

  rankingCampeonato?: number | null;

  posicaoFinal?: number | null;

  kills: number;

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

  kills?: number;

}



export interface ProximaRodada {
  numero: number;
  dataRodada: string;
  diasRestantes: number;
}
