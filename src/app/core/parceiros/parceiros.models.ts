export interface Parceiro {
  id: string;
  nome: string;
  descricao: string | null;
  logoUrl: string | null;
  url: string;
  ativo: boolean;
  ordem: number;
  cliques: number;
}

export interface CreateParceiroPayload {
  nome: string;
  descricao?: string;
  logoUrl?: string;
  url: string;
  ativo?: boolean;
  ordem?: number;
}
