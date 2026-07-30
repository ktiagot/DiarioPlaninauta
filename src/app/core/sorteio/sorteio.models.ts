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
  jaSorteada: boolean;
  totalCheckIns: number;
  jogadores: SorteioJogador[];
  mesas: SorteioMesa[];
}

export interface CheckInStatus {
  rodadaId: string;
  rodadaNumero: number;
  checkIn: boolean;
  jaInscrito: boolean;
  podeCheckIn: boolean;
}
