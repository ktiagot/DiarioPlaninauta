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
  usaGrupos: boolean;
  status: string;
  statusCode: CampeonatoStatusCode;
  createdAt: string;
}

export interface CreateCampeonatoPayload {
  nome: string;
  edicao: string;
  dataInicio: string;
  descricao?: string;
  usaGrupos?: boolean;
}

export interface GrupoAdmin {
  id: string;
  nome: string;
  ordem: number;
  totalInscritos: number;
}

export interface CreateGrupoPayload {
  nome: string;
  ordem?: number;
}

export interface UpdateGrupoPayload {
  nome?: string;
  ordem?: number;
}

export interface InscritoResumo {
  id: string;
  nome: string;
  nick: string;
  email: string;
  deckUrl: string | null;
  deckNome: string;
  comandante: string;
  grupo?: string | null;
  pontos: number;
  vitorias: number;
  posicao: number | null;
  ativo: boolean;
}

export interface UpdateRodadaPayload {
  numero?: number;
  dataRodada?: string;
}

export interface AjustePontosPayload {
  delta: number;
  motivo: string;
}

export interface AjustePontos {
  id: string;
  delta: number;
  motivo: string;
  adminUserId: string;
  createdAt: string;
}

export interface UpdateInscricaoPayload {
  grupoId?: string | null;
  discordNick?: string;
  deckUrl?: string | null;
  preconId?: string;
  preconComandanteId?: string;
  preconComandante2Id?: string | null;
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
