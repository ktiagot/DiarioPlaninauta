export interface PreconListItem {
  id: string;
  nome: string;
  setNome: string;
  ano: number;
}

export interface PreconComandante {
  id: string;
  comandante: string;
  ordem: number;
}

export interface PreconAdmin extends PreconListItem {
  banido: boolean;
  comandantes: PreconComandante[];
}

export interface CreatePreconPayload {
  nome: string;
  setNome: string;
  ano: number;
  comandantes: string[];
}

export interface UpdatePreconPayload {
  nome?: string;
  setNome?: string;
  ano?: number;
  banido?: boolean;
  comandantes?: string[];
}

export interface PreconSyncResult {
  criados: number;
  atualizados: number;
  total: number;
}
