export interface SorteioJogador {
  id: string;
  nomeJogador: string;
  nick: string;
  discordNick: string;
  deckNome: string;
  comandante: string;
  deckUrl: string | null;
  pontos: number;
  posicao: number | null;
  eliminacoes: number;
  checkIn: boolean;
}

export interface SorteioMesaJogador {
  id: string;
  nomeJogador: string;
  nick: string;
  discordNick: string;
  deckNome: string;
  comandante: string;
  pontos: number;
}

export interface SorteioMesa {
  id: string;
  numeroMesa: number;
  jogadores: SorteioMesaJogador[];
}

export interface SorteioSnapshot {
  campeonatoId: string;
  campeonatoNome: string;
  rodadaId: string | null;
  rodadaNumero: number | null;
  dataRodada: string | null;
  jaSorteada: boolean;
  totalCheckIns: number;
  podeSortear: boolean;
  podeReSortear: boolean;
  jogadores: SorteioJogador[];
  mesas: SorteioMesa[];
}

export interface CheckInStatus {
  rodadaId: string | null;
  rodadaNumero: number | null;
  checkIn: boolean;
  jaInscrito: boolean;
  podeCheckIn: boolean;
}

export interface AbrirRodadaContext {
  proximoNumero: number;
  podeAbrirRodada: boolean;
  bloqueioMotivo: string | null;
  rodadaCheckInId: string | null;
}

export interface RodadaListMesaJogador {
  inscricaoId: string;
  nick: string;
  comandante: string;
}

export interface RodadaListMesa {
  id: string;
  numeroMesa: number;
  pendente: boolean;
  jogadores: RodadaListMesaJogador[];
}

export interface RodadaListItem {
  id: string;
  numero: number;
  dataRodada: string;
  status: 'CHECK_IN' | 'EM_ANDAMENTO' | 'FINALIZADA';
  totalCheckIns: number;
  mesasPendentes: number;
  mesasFinalizadas: number;
  mesas: RodadaListMesa[];
}

export interface RodadasListResponse {
  contexto: AbrirRodadaContext;
  rodadas: RodadaListItem[];
}

export interface CreateRodadaPayload {
  numero: number;
  dataRodada: string;
}
