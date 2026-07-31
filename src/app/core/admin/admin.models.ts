export interface SorteioJogador {
  inscricaoId: string;
  nome: string;
  nick: string;
  comandante: string;
  pontos: number;
  posicao: number | null;
  checkedIn: boolean;
}

export interface SorteioMesaJogador {
  inscricaoId: string;
  nome: string;
  nick: string;
  comandante: string;
  pontos: number;
  posicaoFinal: number | null;
  kills: number;
}

export interface SorteioMesa {
  mesaId: string;
  numeroMesa: number;
  finalizada: boolean;
  linkPartida: string | null;
  empate: boolean;
  jogadores: SorteioMesaJogador[];
}

export interface SorteioSnapshot {
  campeonatoId: string;
  campeonatoNome: string;
  rodadaId: string | null;
  rodadaNumero: number | null;
  rodadaFinalizada: boolean;
  classificacao: SorteioJogador[];
  mesas: SorteioMesa[];
}

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
  linkPartida: string | null;
  empate: boolean;
  jogadores: RodadaAtualJogador[];
}

export interface RodadaAtual {
  rodadaId: string;
  numero: number;
  ativa: boolean;
  finalizada: boolean;
  mesas: RodadaAtualMesa[];
}

export interface CheckInStatus {
  checkedIn: boolean;
  rodadaId: string | null;
  rodadaNumero: number | null;
}
