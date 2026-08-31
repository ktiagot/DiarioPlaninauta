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
    | 'geral';
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
}

export interface ContadorNaoLidas {
  count: number;
}
