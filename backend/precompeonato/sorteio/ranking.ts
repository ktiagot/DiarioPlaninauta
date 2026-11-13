import { Prisma } from '@prisma/client';

export const PONTOS_VITORIA = 3;
export const PONTOS_SEGUNDO = 1;
export const PONTOS_EMPATE = 1;

export type MesaParaPontos = {
  empate: boolean;
  empatadosInscricaoIds: string[];
  jogadores: { inscricaoId: string; posicaoFinal: number | null }[];
};

export type MesaParaRanking = MesaParaPontos & {
  jogadores: { inscricaoId: string; posicaoFinal: number | null; kills: number }[];
};

export type InscricaoParaRanking = {
  id: string;
  pontosAjuste: number;
  ativo: boolean;
  updatedAt: Date;
};

export type LinhaRanking = {
  id: string;
  /** Pontos das mesas + ajuste manual. */
  pontos: number;
  /** Eliminações somadas nas mesas das rodadas finalizadas. */
  eliminacoes: number;
  /** Força dos adversários: soma dos pontos (das mesas) de cada adversário enfrentado. */
  forcaAdversarios: number;
  /** Posição no ranking (só inscrições ativas). */
  posicao: number | null;
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
 * Calcula pontos, critérios de desempate e posições (função pura).
 *
 * Ordem do ranking (só inscrições ativas):
 *  1. pontos (mesas + ajuste manual), maior primeiro
 *  2. eliminações, maior primeiro
 *  3. força dos adversários (soma dos pontos dos adversários enfrentados), maior primeiro
 *  4. updatedAt e id, só para a ordem ser estável
 */
export function calcularRanking(
  inscricoes: InscricaoParaRanking[],
  mesas: MesaParaRanking[],
): Map<string, LinhaRanking> {
  const derivados = new Map<string, number>();
  const eliminacoes = new Map<string, number>();

  for (const mesa of mesas) {
    for (const [id, p] of pontosDaMesa(mesa)) {
      derivados.set(id, (derivados.get(id) ?? 0) + p);
    }
    for (const j of mesa.jogadores) {
      eliminacoes.set(j.inscricaoId, (eliminacoes.get(j.inscricaoId) ?? 0) + j.kills);
    }
  }

  // A força usa só os pontos vindos das mesas: ajuste manual (ex.: punição) não muda o adversário.
  const forca = new Map<string, number>();
  for (const mesa of mesas) {
    for (const j of mesa.jogadores) {
      let soma = 0;
      for (const outro of mesa.jogadores) {
        if (outro.inscricaoId !== j.inscricaoId) soma += derivados.get(outro.inscricaoId) ?? 0;
      }
      forca.set(j.inscricaoId, (forca.get(j.inscricaoId) ?? 0) + soma);
    }
  }

  const linhas = inscricoes.map((i) => ({
    insc: i,
    id: i.id,
    pontos: (derivados.get(i.id) ?? 0) + i.pontosAjuste,
    eliminacoes: eliminacoes.get(i.id) ?? 0,
    forcaAdversarios: forca.get(i.id) ?? 0,
  }));

  const ordenados = linhas
    .filter((l) => l.insc.ativo)
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.eliminacoes - a.eliminacoes ||
        b.forcaAdversarios - a.forcaAdversarios ||
        a.insc.updatedAt.getTime() - b.insc.updatedAt.getTime() ||
        a.id.localeCompare(b.id),
    );
  const posicao = new Map(ordenados.map((l, idx) => [l.id, idx + 1]));

  return new Map(
    linhas.map((l) => [
      l.id,
      {
        id: l.id,
        pontos: l.pontos,
        eliminacoes: l.eliminacoes,
        forcaAdversarios: l.forcaAdversarios,
        posicao: posicao.get(l.id) ?? null,
      },
    ]),
  );
}

/**
 * Recalcula pontos e posições do campeonato de forma idempotente a partir das
 * mesas das rodadas finalizadas (ver `calcularRanking` para a ordem de desempate).
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
        jogadores: { select: { inscricaoId: true, posicaoFinal: true, kills: true } },
      },
    }),
  ]);

  const ranking = calcularRanking(inscricoes, mesas);

  await Promise.all(
    inscricoes.flatMap((i) => {
      const linha = ranking.get(i.id);
      if (!linha) return [];
      const data: Prisma.InscricaoUpdateInput = {};
      if (linha.pontos !== i.pontos) data.pontos = linha.pontos;
      if (linha.posicao !== null && linha.posicao !== i.posicao) data.posicao = linha.posicao;
      return Object.keys(data).length > 0
        ? [tx.inscricao.update({ where: { id: i.id }, data })]
        : [];
    }),
  );
}
