export type SorteioPlayer = {
  id: string;
  pontos: number;
  deckNome: string;
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

function buildTableSizes(n: number): number[] {
  if (n < 3) return [];
  if (n % 4 === 0) return Array(n / 4).fill(4);
  if (n % 4 === 3) return [...Array(Math.floor(n / 4)).fill(4), 3];
  if (n % 4 === 2) {
    if (n === 6) return [3, 3];
    const fours = Math.floor(n / 4) - 1;
    return [...Array(Math.max(0, fours)).fill(4), 3, 3];
  }
  // rem === 1: 5, 9, 13...
  if (n === 5) return [3];
  if (n === 9) return [3, 3, 3];
  let left = n;
  const sizes: number[] = [];
  while (left > 6) {
    sizes.push(4);
    left -= 4;
  }
  if (left === 6) sizes.push(3, 3);
  else if (left === 5) sizes.push(3);
  else if (left === 4) sizes.push(4);
  else if (left === 3) sizes.push(3);
  return sizes;
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

function pickBestCandidate(
  table: SorteioPlayer[],
  pool: SorteioPlayer[],
  opponents: Set<OpponentPairKey>,
  opts: { hardAvoidRematch: boolean; softAvoidRematch: boolean; avoidSameDeck: boolean },
): SorteioPlayer | null {
  if (pool.length === 0) return null;

  let best: SorteioPlayer | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of pool) {
    const trial = [...table, candidate];
    const rematches = rematchCount(trial, opponents);

    if (opts.hardAvoidRematch && rematches > 0) continue;

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
  opts: { hardAvoidRematch: boolean; softAvoidRematch: boolean; avoidSameDeck: boolean },
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
    // Prioritize frequent decks as seeds, then fill avoiding same deck
    const byDeck = new Map<string, SorteioPlayer[]>();
    for (const p of shuffle(players)) {
      const key = p.deckNome.trim().toLowerCase();
      const list = byDeck.get(key) ?? [];
      list.push(p);
      byDeck.set(key, list);
    }
    const deckOrder = [...byDeck.entries()].sort((a, b) => b[1].length - a[1].length);
    const ordered: SorteioPlayer[] = [];
    // Round-robin from largest deck groups to spread seeds
    let added = true;
    while (added) {
      added = false;
      for (const [, list] of deckOrder) {
        if (list.length) {
          ordered.push(list.shift()!);
          added = true;
        }
      }
    }
    return seatPlayers(ordered, sizes, opponents, {
      hardAvoidRematch: false,
      softAvoidRematch: false,
      avoidSameDeck: true,
    });
  }

  // Sort by points desc, shuffle within same score
  const byScore = new Map<number, SorteioPlayer[]>();
  for (const p of players) {
    const list = byScore.get(p.pontos) ?? [];
    list.push(p);
    byScore.set(p.pontos, list);
  }
  const scores = [...byScore.keys()].sort((a, b) => b - a);
  const ordered: SorteioPlayer[] = [];
  for (const s of scores) {
    ordered.push(...shuffle(byScore.get(s)!));
  }

  const hard = rodadaNumero === 3;
  const soft = rodadaNumero >= 2;

  return seatPlayers(ordered, sizes, opponents, {
    hardAvoidRematch: hard,
    softAvoidRematch: soft,
    avoidSameDeck: false,
  });
}
