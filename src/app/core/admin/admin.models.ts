export type {
  SorteioJogador,
  SorteioMesa,
  SorteioMesaJogador,
  SorteioSnapshot,
  CheckInStatus,
  AbrirRodadaContext,
  RodadaListItem,
  RodadaListMesa,
  RodadasListResponse,
  CreateRodadaPayload,
} from '../sorteio/sorteio.models';

export interface RodadaAtualJogador {
  inscricaoId: string;
  nome: string;
  nick: string;
  comandante: string;
  posicaoFinal: number | null;
  kills: number;
}

export interface RodadaAtualMesa {
  mesaId: string;
  numeroMesa: number;
  finalizada: boolean;
  validada: boolean;
  validadaEm?: string | null;
  linkPartida: string | null;
  empate: boolean;
  empatadosInscricaoIds?: string[];
  jogadores: RodadaAtualJogador[];
}

export interface RodadaAtual {
  rodadaId: string;
  numero: number;
  ativa: boolean;
  finalizada: boolean;
  podeFinalizar?: boolean;
  mesas: RodadaAtualMesa[];
}

export interface SubmitResultadoPayload {
  jogadores: { inscricaoId: string; posicaoFinal: number; kills: number }[];
  empate: boolean;
  empatadosInscricaoIds?: string[];
  linkPartida?: string;
}

export type CampeonatoStatusCode =
  | 'RASCUNHO'
  | 'INSCRICOES_ABERTAS'
  | 'EM_ANDAMENTO'
  | 'ENCERRADO';

export interface CampeonatoAdmin {
  id: string;
  nome: string;
  edicao: string;
  dataInicio: string;
  descricao: string | null;
  bannerUrl: string | null;
  status: string;
  statusCode: CampeonatoStatusCode;
  createdAt: string;
}

export interface CreateCampeonatoPayload {
  nome: string;
  edicao: string;
  dataInicio: string;
  descricao?: string;
}

export interface InscritoResumo {
  id: string;
  nome: string;
  nick: string;
  email: string;
  deckUrl: string | null;
  deckNome: string;
  comandante: string;
  pontos: number;
  vitorias: number;
  posicao: number | null;
  ativo: boolean;
}

export interface JogadorAdmin {
  id: string;
  email: string;
  nome: string;
  nick: string;
  isApoiadorAtivo: boolean;
  isExApoiador: boolean;
  lastValidationAt: string | null;
  monthlyContribution: number | null;
}

export interface VerificarApoiaResponse {
  email: string;
  ativo: boolean;
  isBacker: boolean;
  isPaidThisMonth: boolean;
  thisMonthPaidValue: number | null;
  apiIndisponivel: boolean;
}
