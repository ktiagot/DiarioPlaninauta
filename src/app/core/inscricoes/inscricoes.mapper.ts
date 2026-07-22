import { InscricaoApi, JogadorInscrito } from './inscricoes.models';

export function mapInscricao(i: InscricaoApi): Omit<
  JogadorInscrito,
  'meta' | 'rodada' | 'mesa' | 'ranking' | 'eliminacoes'
> & {
  rankingBase: number;
} {
  return {
    id: i.id,
    rankingBase: i.ranking_campeonato ?? i.ranking ?? i.pontos ?? 0,
    nome: i.nome,
    nickname: i.nickname,
    comandante: i.comandante ?? i.comandante_principal ?? '',
    deckNome: i.deck_nome ?? '',
    deckUrl: i.deck_url,
    pontos: i.pontos ?? 0,
  };
}

export function aplicarMeta(jogadores: JogadorInscrito[]): JogadorInscrito[] {
  const deckCounts = new Map<string, number>();

  for (const j of jogadores) {
    const key = j.deckNome.toLowerCase();
    deckCounts.set(key, (deckCounts.get(key) ?? 0) + 1);
  }

  return jogadores.map((j) => ({
    ...j,
    meta: deckCounts.get(j.deckNome.toLowerCase()) ?? 1,
  }));
}

export function ordenarPorRanking(jogadores: JogadorInscrito[]): JogadorInscrito[] {
  return [...jogadores]
    .sort((a, b) => a.ranking - b.ranking)
    .map((j, index) => ({ ...j, ranking: index + 1 }));
}
