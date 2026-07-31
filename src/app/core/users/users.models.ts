export interface CreateUserRequest {
  email: string;
  senha: string;
  nome: string;
  sobrenome: string;
  nick: string;
  telefone: string;
  formatos: string[];
  cidade: string;
}

export interface AvailabilityResponse {
  emailTaken: boolean | null;
  nickTaken: boolean | null;
}

export interface User {
  id: string;
  email: string;
  nome: string | null;
  sobrenome: string | null;
  nick: string | null;
  telefone: string | null;
  formatos: string[];
  cidade: string | null;
  foto: string | null;
  genero: string | null;
  tier: string | null;
  badge: string | null;
  formatoFavorito: string | null;
  diasDisponiveis: string[];
  horarios: string[];
  partidas: number | null;
  vitorias: number | null;
  eliminacoes: number | null;
  winRate: number | null;
  pontosTotais: number | null;
  melhoresResultados: number[];
  preCampeonatos: string[];
  decksMaisUsados: string[];
  isAdmin: boolean;
  isExApoiador: boolean;
  isApoiadorAtivo: boolean;
  monthlyContribution: number | null;
  lastValidationAt: string | null;
  apoiandoDesde: string | null;
  estado: string | null;
  pais: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
}
