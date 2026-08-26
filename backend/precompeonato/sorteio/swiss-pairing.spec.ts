import {
  opponentKey,
  sortearMesasSuico,
  type SorteioPlayer,
} from './swiss-pairing';

function players(n: number): SorteioPlayer[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    pontos: 0,
    deckNome: `Deck ${(i % 4) + 1}`,
  }));
}

describe('swiss-pairing', () => {
  it('opponentKey is order-independent', () => {
    expect(opponentKey('a', 'b')).toBe(opponentKey('b', 'a'));
  });

  it('forms one table of 4 for 4 players', () => {
    const mesas = sortearMesasSuico(players(4), 1, new Set());
    expect(mesas).toHaveLength(1);
    expect(mesas[0].jogadorIds).toHaveLength(4);
  });

  it('forms one table of 3 for 5 players', () => {
    const mesas = sortearMesasSuico(players(5), 1, new Set());
    expect(mesas).toHaveLength(1);
    expect(mesas[0].jogadorIds).toHaveLength(3);
  });

  it('forms two tables of 4 for 8 players', () => {
    const mesas = sortearMesasSuico(players(8), 1, new Set());
    expect(mesas).toHaveLength(2);
    expect(mesas.every((m) => m.jogadorIds.length === 4)).toBe(true);
  });

  it('returns empty for fewer than 3 players', () => {
    const mesas = sortearMesasSuico(players(2), 1, new Set());
    expect(mesas).toHaveLength(0);
  });

  it('round 2+ assigns all checked-in players to tables', () => {
    const list = players(7).map((p, i) => ({ ...p, pontos: i % 3 }));
    const mesas = sortearMesasSuico(list, 2, new Set());
    const seated = mesas.flatMap((m) => m.jogadorIds);
    expect(seated).toHaveLength(7);
    expect(new Set(seated).size).toBe(7);
  });

  it('hard-avoids rematch on round 3 when alternatives exist', () => {
    const list: SorteioPlayer[] = players(8).map((p, i) => ({
      ...p,
      pontos: i < 4 ? 6 : 3,
    }));
    const opponents = new Set([opponentKey('p1', 'p2')]);
    const mesas = sortearMesasSuico(list, 3, opponents);
    expect(mesas).toHaveLength(2);
    for (const mesa of mesas) {
      const ids = new Set(mesa.jogadorIds);
      expect(ids.has('p1') && ids.has('p2')).toBe(false);
    }
  });
});
