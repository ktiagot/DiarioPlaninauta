export interface AnaliseInscritoPublico {
  nick: string;
  commander: string;
  posicao: number;
  listaEspera: boolean;
}

export interface AnaliseMinhaInscricao {
  id: string;
  commander: string;
  linkDeck: string;
  bracket: string | null;
  budget: string;
  objetivos: string;
  posicao: number;
  listaEspera: boolean;
}

export interface AnaliseSessao {
  id: string;
  dataHora: string;
  titulo: string | null;
  vagas: number;
  aberta: boolean;
  observacoes: string | null;
  confirmados: number;
  totalListaEspera: number;
  minhaInscricao: AnaliseMinhaInscricao | null;
  inscritos: AnaliseInscritoPublico[];
}

export interface AnaliseInscricaoAdmin {
  id: string;
  userId: string;
  nome: string;
  nick: string;
  commander: string;
  linkDeck: string;
  bracket: string | null;
  budget: string;
  objetivos: string;
  posicao: number;
  listaEspera: boolean;
  createdAt: string;
}

export interface InscreverAnalisePayload {
  commander: string;
  linkDeck: string;
  bracket?: string;
  budget: string;
  objetivos: string;
}

export interface AnaliseSessaoPayload {
  dataHora: string;
  titulo?: string;
  vagas: number;
  aberta?: boolean;
  observacoes?: string;
}
