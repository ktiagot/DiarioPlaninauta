import { Prisma } from '@prisma/client';

export const PONTOS_VITORIA = 3;
export const PONTOS_SEGUNDO = 1;
export const PONTOS_EMPATE = 1;

export type MesaParaPontos = {
  empate: boolean;
  empatadosInscricaoIds: string[];
  jogadores: { inscricaoId: string; posicaoFinal: number | null }[];
};

/** Pontos ganhos por inscrição em uma mesa (1º=3, 2º=1; empate=1 por empatado). */
export function pontosDaMesa(mesa: MesaParaPontos): Map<string, number> {
  const pontos = new Map<string, number>();

  if (mesa.empate && mesa.empatadosInscricaoIds.length > 0) {
    for (const id of mesa.empatadosInscricaoIds) pontos.set(id, PONTOS_EMPATE);
    return pontos;
  }

  for (const j of mesa.jogadores) {
    if (j.posicaoFinal === 1) pontos.set(j.inscricaoId, PONTOS_VITORIA);
    else if (j.posicaoFinal === 2) pontos.set(j.inscricaoId, PONTOS_SEGUNDO);
  }
  return pontos;
}

/**
 * Recalcula pontos e posições do campeonato de forma idempotente:
 * pontos = soma das mesas de rodadas finalizadas + pontosAjuste.
 * Ranking considera só inscrições ativas (pontos desc, updatedAt asc, id asc).
 */
export async function recalcularRanking(
  tx: Prisma.TransactionClient,
  campeonatoId: string,
): Promise<void> {
  const [inscricoes, mesas] = await Promise.all([
    tx.inscricao.findMany({
      where: { campeonatoId },
      select: {
        id: true,
        pontos: true,
        pontosAjuste: true,
        posicao: true,
        ativo: true,
        updatedAt: true,
      },
    }),
    tx.mesaTorneio.findMany({
      where: { rodada: { campeonatoId, finalizada: true } },
      select: {
        empate: true,
        empatadosInscricaoIds: true,
        jogadores: { select: { inscricaoId: true, posicaoFinal: true } },
      },
    }),
  ]);

  const derivados = new Map<string, number>();
  for (const mesa of mesas) {
    for (const [id, p] of pontosDaMesa(mesa)) {
      derivados.set(id, (derivados.get(id) ?? 0) + p);
    }
  }

  const totais = inscricoes.map((i) => ({
    ...i,
    total: (derivados.get(i.id) ?? 0) + i.pontosAjuste,
  }));

  const ranking = totais
    .filter((i) => i.ativo)
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.updatedAt.getTime() - b.updatedAt.getTime() ||
        a.id.localeCompare(b.id),
    );
  const novaPosicao = new Map(ranking.map((i, idx) => [i.id, idx + 1]));

  await Promise.all(
    totais.flatMap((i) => {
      const data: Prisma.InscricaoUpdateInput = {};
      if (i.total !== i.pontos) data.pontos = i.total;
      const pos = novaPosicao.get(i.id);
      if (pos !== undefined && pos !== i.posicao) data.posicao = pos;
      return Object.keys(data).length > 0
        ? [tx.inscricao.update({ where: { id: i.id }, data })]
        : [];
    }),
  );
}
