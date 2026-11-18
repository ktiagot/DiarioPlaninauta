export type MesaoTipo = 'JOGADOR' | 'SUPLENTE';

export interface MesaoParticipante {
  nick: string;
  posicao: number;
}

export interface MesaoMinhaInscricao {
  id: string;
  tipo: MesaoTipo;
  posicao: number;
}

export interface MesaoSessao {
  id: string;
  dataHora: string;
  titulo: string | null;
  bracket: string | null;
  vagasJogador: number;
  vagasSuplente: number;
  aberta: boolean;
  observacoes: string | null;
  jogadores: MesaoParticipante[];
  suplentes: MesaoParticipante[];
  minhaInscricao: MesaoMinhaInscricao | null;
}

export interface MesaoInscricaoAdmin {
  id: string;
  userId: string;
  nome: string;
  nick: string;
  tipo: MesaoTipo;
  posicao: number;
  createdAt: string;
}

export interface MesaoSessaoPayload {
  dataHora: string;
  titulo?: string;
  bracket?: string;
  vagasJogador?: number;
  vagasSuplente?: number;
  aberta?: boolean;
  observacoes?: string;
}
