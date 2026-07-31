export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  precoPontos: number;
  imagemUrl: string | null;
  estoque: number | null;
  ativo: boolean;
  createdAt: string;
}

export interface Saldo {
  saldo: number;
}

export interface PontoTransacao {
  id: string;
  tipo: 'credito' | 'debito';
  quantidade: number;
  descricao: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  createdAt: string;
}
