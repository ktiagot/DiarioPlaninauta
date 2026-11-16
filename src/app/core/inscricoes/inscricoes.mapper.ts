import { InscricaoApi, JogadorInscrito } from './inscricoes.models';

export function mapInscricao(i: InscricaoApi): Omit<
  JogadorInscrito,
  'rodada' | 'mesa' | 'ranking'
> & {
  rankingBase: number;
} {
  return {
    id: i.id,
    // A API manda posicao (1 = líder). Sem posição, o jogador vai para o fim da fila.
    rankingBase: i.posicao ?? i.ranking_campeonato ?? i.ranking ?? Number.MAX_SAFE_INTEGER,
    // Backend atual envia `nomeJogador`/`nick`; mantém fallback legado.
    nome: i.nomeJogador ?? i.nome ?? '',
    nickname: i.nick ?? i.nickname,
    comandante: i.comandante ?? i.comandante_principal ?? '',
    deckNome: i.deckNome ?? i.deck_nome ?? '',
    deckUrl: i.deckUrl ?? i.deck_url ?? undefined,
    grupo: i.grupo ?? null,
    pontos: i.pontos ?? 0,
    eliminacoes: i.eliminacoes ?? 0,
    pc: i.pc ?? null,
    opc: i.opc ?? null,
  };
}

export function ordenarPorRanking(jogadores: JogadorInscrito[]): JogadorInscrito[] {
  return [...jogadores]
    .sort((a, b) => a.ranking - b.ranking || b.pontos - a.pontos)
    .map((j, index) => ({ ...j, ranking: index + 1 }));
}
