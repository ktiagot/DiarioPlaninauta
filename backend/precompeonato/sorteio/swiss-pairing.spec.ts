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
    grupo: null,
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

  it('forms one table of 5 for 5 players (nobody left out)', () => {
    const mesas = sortearMesasSuico(players(5), 1, new Set());
    expect(mesas).toHaveLength(1);
    expect(mesas[0].jogadorIds).toHaveLength(5);
  });

  it('seats every player for tricky counts (5,7,9,11,13,17)', () => {
    for (const n of [5, 7, 9, 11, 13, 17]) {
      const mesas = sortearMesasSuico(players(n), 1, new Set());
      const seated = mesas.flatMap((m) => m.jogadorIds);
      expect(seated).toHaveLength(n);
      expect(new Set(seated).size).toBe(n);
      // Todas as mesas têm tamanho válido (3, 4 ou 5 no caso de n=5).
      for (const m of mesas) {
        expect(m.jogadorIds.length).toBeGreaterThanOrEqual(3);
        expect(m.jogadorIds.length).toBeLessThanOrEqual(5);
      }
    }
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

  it('rodada 1: não repete grupo na mesa quando usaGrupos e há distribuição viável', () => {
    // 8 jogadores, 4 grupos: cada mesa de 4 pode ter grupos distintos.
    const armies = ['Anãos', 'Humanos', 'Elfos', 'Wargs'];
    const list: SorteioPlayer[] = players(8).map((p, i) => ({
      ...p,
      grupo: armies[i % 4],
    }));
    const mesas = sortearMesasSuico(list, 1, new Set(), { usaGrupos: true });
    expect(mesas).toHaveLength(2);
    const byId = new Map(list.map((p) => [p.id, p]));
    for (const mesa of mesas) {
      const grupos = mesa.jogadorIds.map((id) => byId.get(id)!.grupo);
      expect(new Set(grupos).size).toBe(grupos.length);
    }
  });

  it('rodada 1: nunca trava o sorteio mesmo sem grupos suficientes', () => {
    // Todos do mesmo grupo: fallback deve permitir montar as mesas.
    const list: SorteioPlayer[] = players(8).map((p) => ({
      ...p,
      grupo: 'Anãos',
    }));
    const mesas = sortearMesasSuico(list, 1, new Set(), { usaGrupos: true });
    const seated = mesas.flatMap((m) => m.jogadorIds);
    expect(seated).toHaveLength(8);
  });

  it('evita rematch já na rodada 2 quando há alternativa', () => {
    const list: SorteioPlayer[] = players(8).map((p, i) => ({
      ...p,
      pontos: i < 4 ? 6 : 3,
    }));
    const opponents = new Set([opponentKey('p1', 'p2')]);
    const mesas = sortearMesasSuico(list, 2, opponents);
    expect(mesas).toHaveLength(2);
    for (const mesa of mesas) {
      const ids = new Set(mesa.jogadorIds);
      expect(ids.has('p1') && ids.has('p2')).toBe(false);
    }
  });
});
