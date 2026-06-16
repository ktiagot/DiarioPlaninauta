export interface CreateUserRequest {
  email: string;
  nome: string;
  sobrenome: string;
  nick: string;
  telefone: string;
  formatos: string[];
  cidade: string;
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
  createdAt: string;
  updatedAt: string;
}
