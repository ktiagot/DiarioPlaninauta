export interface UserPublic {
  id: string;
  nick: string;
  nome: string;
  cidade: string;
  estado: string | null;
  formatos: string[];
  diasDisponiveis: string[];
  horarios: string[];
  foto: string | null;
  badge: string | null;
  apoiandoDesde: string | null;
  genero: string | null;
  formatoFavorito: string | null;
  decksMaisUsados: string[];
  preCampeonatos: string[];
  melhoresResultados: number[];
}
