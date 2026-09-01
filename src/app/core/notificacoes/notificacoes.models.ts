export interface Notificacao {
  id: string;
  tipo:
    | 'rodada_nova'
    | 'resultado_publicado'
    | 'favorito_mutuo'
    | 'pontos_creditados'
    | 'mesa_entrou'
    | 'campeonato_novo'
    | 'dia_do_evento'
    | 'convite_mesa'
    | 'geral';
  titulo: string;
  mensagem: string;
  lida: boolean;
  referenciaTipo?: string | null;
  referenciaId?: string | null;
  createdAt: string;
}

export interface ContadorNaoLidas {
  count: number;
}
