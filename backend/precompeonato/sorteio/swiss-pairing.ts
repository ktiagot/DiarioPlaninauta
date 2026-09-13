export type SorteioPlayer = {
  id: string;
  pontos: number;
  deckNome: string;
  exercito: string | null;
};

export type SorteioMesa = {
  numeroMesa: number;
  jogadorIds: string[];
};

/** Par de inscriçãoIds que já sentaram na mesma mesa (ordem irrelevante). */
export type OpponentPairKey = string;

export function opponentKey(a: string, b: string): OpponentPairKey {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Divide `n` jogadores em mesas de 4 (preferencial) e 3, SEMPRE assentando
 * todos (a soma dos tamanhos é exatamente `n`). Como Commander comporta 3–4
 * jogadores, todo n >= 3 é escrito como 4a + 3b, exceto n = 5, que não tem
 * solução com apenas 3/4 — nesse caso usamos uma única mesa de 5 para não
 * deixar ninguém de fora.
 */
function buildTableSizes(n: number): number[] {
  if (n < 3) return [];
  if (n === 5) return [5];

  // Máximo de mesas de 4 tal que o restante seja múltiplo de 3 (>= 0).
  // n - 4*fours >= 0 e divisível por 3. Iteramos de cima para baixo.
  const maxFours = Math.floor(n / 4);
  for (let fours = maxFours; fours >= 0; fours--) {
    const resto = n - fours * 4;
    if (resto % 3 === 0) {
      const threes = resto / 3;
      return [...Array(fours).fill(4), ...Array(threes).fill(3)];
    }
  }

  // Inalcançável para n >= 3 (exceto 5, já tratado), mas mantém a função total.
  return [];
}

function rematchCount(
  table: SorteioPlayer[],
  opponents: Set<OpponentPairKey>,
): number {
  let count = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = i + 1; j < table.length; j++) {
      if (opponents.has(opponentKey(table[i].id, table[j].id))) count++;
    }
  }
  return count;
}

/** Total de reencontros (pares que já jogaram juntos) em um conjunto de mesas. */
function totalRematches(
  mesas: SorteioMesa[],
  players: SorteioPlayer[],
  opponents: Set<OpponentPairKey>,
): number {
  const byId = new Map(players.map((p) => [p.id, p]));
  let total = 0;
  for (const mesa of mesas) {
    const table = mesa.jogadorIds
      .map((id) => byId.get(id))
      .filter((p): p is SorteioPlayer => !!p);
    total += rematchCount(table, opponents);
  }
  return total;
}

function sameDeckCount(table: SorteioPlayer[]): number {
  const counts = new Map<string, number>();
  for (const p of table) {
    const key = p.deckNome.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let dupes = 0;
  for (const c of counts.values()) {
    if (c > 1) dupes += c - 1;
  }
  return dupes;
}

/** Quantidade de jogadores repetindo exército na mesa (ignora sem exército). */
function sameExercitoCount(table: SorteioPlayer[]): number {
  const counts = new Map<string, number>();
  for (const p of table) {
    if (!p.exercito) continue;
    const key = p.exercito.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let dupes = 0;
  for (const c of counts.values()) {
    if (c > 1) dupes += c - 1;
  }
  return dupes;
}

function pickBestCandidate(
  table: SorteioPlayer[],
  pool: SorteioPlayer[],
  opponents: Set<OpponentPairKey>,
  opts: {
    hardAvoidRematch: boolean;
    softAvoidRematch: boolean;
    avoidSameDeck: boolean;
    hardAvoidSameExercito?: boolean;
  },
): SorteioPlayer | null {
  if (pool.length === 0) return null;

  let best: SorteioPlayer | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of pool) {
    const trial = [...table, candidate];
    const rematches = rematchCount(trial, opponents);

    if (opts.hardAvoidRematch && rematches > 0) continue;
    if (opts.hardAvoidSameExercito && sameExercitoCount(trial) > 0) continue;

    let score = 0;
    if (opts.softAvoidRematch) score += rematches * 100;
    if (opts.avoidSameDeck) score += sameDeckCount(trial) * 10;
    // Prefer similar points to table average
    if (table.length > 0) {
      const avg = table.reduce((s, p) => s + p.pontos, 0) / table.length;
      score += Math.abs(candidate.pontos - avg);
    }

    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  // Fallback: relaxa a restrição de exército antes da de rematch (R1 não tem
  // rematch, mas pode não haver exército disponível suficiente na mesa).
  if (!best && opts.hardAvoidSameExercito) {
    return pickBestCandidate(table, pool, opponents, {
      ...opts,
      hardAvoidSameExercito: false,
    });
  }

  // Fallback if hard avoid left no candidates
  if (!best && opts.hardAvoidRematch) {
    return pickBestCandidate(table, pool, opponents, {
      ...opts,
      hardAvoidRematch: false,
      softAvoidRematch: true,
    });
  }

  return best ?? pool[0];
}

function seatPlayers(
  orderedPool: SorteioPlayer[],
  sizes: number[],
  opponents: Set<OpponentPairKey>,
  opts: {
    hardAvoidRematch: boolean;
    softAvoidRematch: boolean;
    avoidSameDeck: boolean;
    hardAvoidSameExercito?: boolean;
  },
): SorteioMesa[] {
  const pool = [...orderedPool];
  const mesas: SorteioMesa[] = [];
  let numero = 1;

  for (const size of sizes) {
    if (pool.length < size) break;
    const table: SorteioPlayer[] = [];
    // Seed: first remaining (already ordered)
    table.push(pool.shift()!);

    while (table.length < size && pool.length > 0) {
      const pick = pickBestCandidate(table, pool, opponents, opts);
      if (!pick) break;
      const idx = pool.findIndex((p) => p.id === pick.id);
      pool.splice(idx, 1);
      table.push(pick);
    }

    if (table.length >= 3) {
      mesas.push({ numeroMesa: numero++, jogadorIds: table.map((p) => p.id) });
    } else {
      // put back
      pool.unshift(...table);
      break;
    }
  }

  return mesas;
}

/**
 * Suíço multiplayer adaptado (mesas de 4, resto 3).
 * Rodada 1: diversidade de deck. 2+: score + rematches conforme regra.
 */
export function sortearMesasSuico(
  players: SorteioPlayer[],
  rodadaNumero: number,
  opponents: Set<OpponentPairKey>,
): SorteioMesa[] {
  const sizes = buildTableSizes(players.length);
  if (sizes.length === 0) return [];

  if (rodadaNumero <= 1) {
    // R1: regra dura — não repetir exército na mesa (com fallback se não houver
    // exércitos suficientes) e diversidade de deck como critério secundário.
    // Greedy pode assentar mal dependendo da ordem; várias tentativas e escolhe
    // a montagem com MENOS repetições de exército (para em zero).
    const TENTATIVAS_R1 = 40;
    let melhorR1: SorteioMesa[] = [];
    let melhorDupes = Number.POSITIVE_INFINITY;

    for (let t = 0; t < TENTATIVAS_R1; t++) {
      // Semeia espalhando os exércitos (round-robin dos maiores grupos) para
      // reduzir colisões antes do preenchimento guloso.
      const byExercito = new Map<string, SorteioPlayer[]>();
      for (const p of shuffle(players)) {
        const key = p.exercito ? p.exercito.trim().toLowerCase() : `__sem__${p.id}`;
        const list = byExercito.get(key) ?? [];
        list.push(p);
        byExercito.set(key, list);
      }
      const exercitoOrder = [...byExercito.entries()].sort(
        (a, b) => b[1].length - a[1].length,
      );
      const ordered: SorteioPlayer[] = [];
      let added = true;
      while (added) {
        added = false;
        for (const [, list] of exercitoOrder) {
          if (list.length) {
            ordered.push(list.shift()!);
            added = true;
          }
        }
      }

      const mesas = seatPlayers(ordered, sizes, opponents, {
        hardAvoidRematch: false,
        softAvoidRematch: false,
        avoidSameDeck: true,
        hardAvoidSameExercito: true,
      });

      const byId = new Map(players.map((p) => [p.id, p]));
      let dupes = 0;
      for (const mesa of mesas) {
        const table = mesa.jogadorIds
          .map((id) => byId.get(id))
          .filter((p): p is SorteioPlayer => !!p);
        dupes += sameExercitoCount(table);
      }

      if (dupes < melhorDupes) {
        melhorDupes = dupes;
        melhorR1 = mesas;
        if (dupes === 0) break;
      }
    }

    return melhorR1;
  }

  const scores = [...new Set(players.map((p) => p.pontos))].sort((a, b) => b - a);

  // Nunca repetir oponente enquanto houver alternativa. O algoritmo é guloso
  // (mesa a mesa), então uma escolha inicial ruim pode gerar reencontros que
  // outra ordem evitaria. Fazemos várias tentativas (embaralhando quem tem a
  // mesma pontuação) e escolhemos a montagem com MENOS reencontros — parando
  // assim que uma tentativa atinge zero.
  const TENTATIVAS = 40;
  let melhor: SorteioMesa[] = [];
  let melhorRematches = Number.POSITIVE_INFINITY;

  for (let t = 0; t < TENTATIVAS; t++) {
    // Ordena por pontos (desc), embaralhando dentro do mesmo score.
    const byScore = new Map<number, SorteioPlayer[]>();
    for (const p of players) {
      const list = byScore.get(p.pontos) ?? [];
      list.push(p);
      byScore.set(p.pontos, list);
    }
    const ordered: SorteioPlayer[] = [];
    for (const s of scores) {
      ordered.push(...shuffle(byScore.get(s)!));
    }

    const mesas = seatPlayers(ordered, sizes, opponents, {
      hardAvoidRematch: true,
      softAvoidRematch: true,
      avoidSameDeck: false,
    });

    const rematches = totalRematches(mesas, players, opponents);
    if (rematches < melhorRematches) {
      melhorRematches = rematches;
      melhor = mesas;
      if (rematches === 0) break;
    }
  }

  return melhor;
}
