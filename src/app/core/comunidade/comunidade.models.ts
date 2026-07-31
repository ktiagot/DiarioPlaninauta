export interface JogadorComunidade {
  id: string;
  nick: string;
  nome: string;
  cidade: string;
  estado?: string | null;
  formatos: string[];
  diasDisponiveis: string[];
  horarios: string[];
  foto?: string | null;
  apoiandoDesde?: string | null;
}

export interface ContatoResponse {
  mutuo: boolean;
  telefone?: string;
  discord?: string;
}
