import { calcularRanking, pontosDaMesa, recalcularRanking } from './ranking';

describe('pontosDaMesa', () => {
  const jogadores = [
    { inscricaoId: 'a', posicaoFinal: 1, kills: 0 },
    { inscricaoId: 'b', posicaoFinal: 2, kills: 0 },
    { inscricaoId: 'c', posicaoFinal: 3, kills: 0 },
    { inscricaoId: 'd', posicaoFinal: 4 },
  ];

  it('1º=3, 2º=1, demais 0', () => {
    const p = pontosDaMesa({ empate: false, empatadosInscricaoIds: [], jogadores });
    expect(p.get('a')).toBe(3);
    expect(p.get('b')).toBe(1);
    expect(p.has('c')).toBe(false);
    expect(p.has('d')).toBe(false);
  });

  it('empate: 1 por empatado e ignora posições', () => {
    const p = pontosDaMesa({
      empate: true,
      empatadosInscricaoIds: ['a', 'b'],
      jogadores,
    });
    expect([...p.entries()]).toEqual([
      ['a', 1],
      ['b', 1],
    ]);
  });
});

describe('recalcularRanking', () => {
  const d = (n: number) => new Date(2026, 0, n);

  function fakeTx(
    inscricoes: Array<{
      id: string;
      pontos: number;
      pontosAjuste: number;
      posicao: number | null;
      ativo: boolean;
      updatedAt: Date;
    }>,
    mesas: Array<{
      empate: boolean;
      empatadosInscricaoIds: string[];
      jogadores: { inscricaoId: string; posicaoFinal: number | null; kills: number }[];
    }>,
  ) {
    const update = jest.fn();
    const tx = {
      inscricao: { findMany: jest.fn().mockResolvedValue(inscricoes), update },
      mesaTorneio: { findMany: jest.fn().mockResolvedValue(mesas) },
    };
    return { tx: tx as never, update };
  }

  it('deriva pontos das mesas + ajuste e ordena só ativos', async () => {
    const { tx, update } = fakeTx(
      [
        { id: 'a', pontos: 99, pontosAjuste: 0, posicao: null, ativo: true, updatedAt: d(1) },
        { id: 'b', pontos: 0, pontosAjuste: 5, posicao: null, ativo: true, updatedAt: d(2) },
        { id: 'c', pontos: 0, pontosAjuste: 0, posicao: 7, ativo: false, updatedAt: d(3) },
      ],
      [
        {
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [
            { inscricaoId: 'a', posicaoFinal: 1, kills: 0 },
            { inscricaoId: 'b', posicaoFinal: 2, kills: 0 },
            { inscricaoId: 'c', posicaoFinal: 3, kills: 0 },
          ],
        },
      ],
    );

    await recalcularRanking(tx, 'camp');

    const calls = new Map(
      update.mock.calls.map(([arg]) => [arg.where.id, arg.data]),
    );
    expect(calls.get('a')).toEqual({ pontos: 3, posicao: 2 }); // 3 < 6
    expect(calls.get('b')).toEqual({ pontos: 6, posicao: 1 }); // 1 + ajuste 5
    expect(calls.has('c')).toBe(false); // inativo, sem mudança
  });

  it('é idempotente: sem mudanças não escreve', async () => {
    const { tx, update } = fakeTx(
      [{ id: 'a', pontos: 3, pontosAjuste: 0, posicao: 1, ativo: true, updatedAt: d(1) }],
      [
        {
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [{ inscricaoId: 'a', posicaoFinal: 1, kills: 0 }],
        },
      ],
    );

    await recalcularRanking(tx, 'camp');
    expect(update).not.toHaveBeenCalled();
  });
});

describe('calcularRanking (desempate)', () => {
  const d = (n: number) => new Date(2026, 0, n);
  const insc = (id: string, over: Partial<{ pontosAjuste: number; ativo: boolean; updatedAt: Date }> = {}) => ({
    id,
    pontosAjuste: 0,
    ativo: true,
    updatedAt: d(1),
    ...over,
  });
  const mesa = (
    jogadores: Array<[string, number | null, number]>,
    over: { empate?: boolean; empatados?: string[] } = {},
  ) => ({
    empate: over.empate ?? false,
    empatadosInscricaoIds: over.empatados ?? [],
    jogadores: jogadores.map(([inscricaoId, posicaoFinal, kills]) => ({ inscricaoId, posicaoFinal, kills })),
  });
  const pos = (r: Map<string, { posicao: number | null }>, id: string) => r.get(id)?.posicao;

  it('empate em pontos: quem tem mais eliminações fica na frente', () => {
    // a e b: 1 ponto cada (2º lugar em mesas diferentes); b eliminou mais.
    const r = calcularRanking(
      [insc('a'), insc('b'), insc('x'), insc('y')],
      [mesa([['x', 1, 2], ['a', 2, 0]]), mesa([['y', 1, 2], ['b', 2, 1]])],
    );
    expect(r.get('a')?.pontos).toBe(1);
    expect(r.get('b')?.pontos).toBe(1);
    expect(pos(r, 'b')).toBeLessThan(pos(r, 'a') as number);
  });

  it('empate em pontos e eliminações: maior força de adversários vence', () => {
    // a e b: 1 ponto, 0 eliminações. a enfrentou o líder (x, 3 pts); b enfrentou quem fez 1 ponto.
    const r = calcularRanking(
      [insc('a'), insc('b'), insc('x'), insc('y'), insc('z')],
      [mesa([['x', 1, 0], ['a', 2, 0]]), mesa([['y', 2, 0], ['b', 2, 0], ['z', 1, 0]])],
    );
    expect(r.get('a')?.pontos).toBe(1);
    expect(r.get('b')?.pontos).toBe(1);
    expect(r.get('a')?.forcaAdversarios).toBe(3);
    expect(r.get('b')?.forcaAdversarios).toBe(4);
    expect(pos(r, 'b')).toBeLessThan(pos(r, 'a') as number);
  });

  it('pontos têm prioridade sobre eliminações', () => {
    const r = calcularRanking(
      [insc('a'), insc('b')],
      [mesa([['a', 1, 0], ['b', 3, 5]])],
    );
    expect(pos(r, 'a')).toBe(1);
    expect(pos(r, 'b')).toBe(2);
  });

  it('ajuste manual conta nos pontos mas não altera a força dos adversários', () => {
    const r = calcularRanking(
      [insc('a', { pontosAjuste: 10 }), insc('b')],
      [mesa([['a', 1, 0], ['b', 2, 0]])],
    );
    expect(r.get('a')?.pontos).toBe(13);
    expect(r.get('b')?.forcaAdversarios).toBe(3);
  });

  it('inativos não recebem posição, mas contam como adversários', () => {
    const r = calcularRanking(
      [insc('a'), insc('b', { ativo: false })],
      [mesa([['a', 2, 0], ['b', 1, 0]])],
    );
    expect(pos(r, 'b')).toBeNull();
    expect(pos(r, 'a')).toBe(1);
    expect(r.get('a')?.forcaAdversarios).toBe(3);
  });

  it('empate total desempata de forma estável por updatedAt e id', () => {
    const r = calcularRanking([insc('b', { updatedAt: d(2) }), insc('a', { updatedAt: d(2) }), insc('c', { updatedAt: d(1) })], []);
    expect(pos(r, 'c')).toBe(1);
    expect(pos(r, 'a')).toBe(2);
    expect(pos(r, 'b')).toBe(3);
  });
});