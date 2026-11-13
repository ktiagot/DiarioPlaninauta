import { pontosDaMesa, recalcularRanking } from './ranking';

describe('pontosDaMesa', () => {
  const jogadores = [
    { inscricaoId: 'a', posicaoFinal: 1 },
    { inscricaoId: 'b', posicaoFinal: 2 },
    { inscricaoId: 'c', posicaoFinal: 3 },
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
      jogadores: { inscricaoId: string; posicaoFinal: number | null }[];
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
            { inscricaoId: 'a', posicaoFinal: 1 },
            { inscricaoId: 'b', posicaoFinal: 2 },
            { inscricaoId: 'c', posicaoFinal: 3 },
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
          jogadores: [{ inscricaoId: 'a', posicaoFinal: 1 }],
        },
      ],
    );

    await recalcularRanking(tx, 'camp');
    expect(update).not.toHaveBeenCalled();
  });
});
