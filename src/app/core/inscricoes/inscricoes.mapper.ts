import { InscricaoApi, JogadorInscrito } from './inscricoes.models';

export function mapInscricao(i: InscricaoApi): Omit<
  JogadorInscrito,
  'rodada' | 'mesa' | 'ranking' | 'eliminacoes'
> & {
  rankingBase: number;
} {
  return {
    id: i.id,
    rankingBase: i.ranking_campeonato ?? i.ranking ?? i.pontos ?? 0,
    // Backend atual envia `nomeJogador`/`nick`; mantém fallback legado.
    nome: i.nomeJogador ?? i.nome ?? '',
    nickname: i.nick ?? i.nickname,
    comandante: i.comandante ?? i.comandante_principal ?? '',
    deckNome: i.deckNome ?? i.deck_nome ?? '',
    deckUrl: i.deckUrl ?? i.deck_url ?? undefined,
    grupo: i.grupo ?? null,
    pontos: i.pontos ?? 0,
  };
}

export function ordenarPorRanking(jogadores: JogadorInscrito[]): JogadorInscrito[] {
  return [...jogadores]
    .sort((a, b) => a.ranking - b.ranking)
    .map((j, index) => ({ ...j, ranking: index + 1 }));
}
