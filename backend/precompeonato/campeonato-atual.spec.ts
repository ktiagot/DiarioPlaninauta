import { CampeonatoStatus } from '@prisma/client';
import { findCampeonatoAtual } from './campeonato-atual';

describe('findCampeonatoAtual', () => {
  const aberto = { id: 'c1', status: CampeonatoStatus.EM_ANDAMENTO };
  const recente = { id: 'c2', status: CampeonatoStatus.RASCUNHO };

  function prismaCom(findFirst: jest.Mock) {
    return { campeonato: { findFirst } } as never;
  }

  it('prefere o campeonato aberto, mesmo havendo rascunho mais recente', async () => {
    const findFirst = jest.fn().mockResolvedValueOnce(aberto).mockResolvedValueOnce(recente);

    await expect(findCampeonatoAtual(prismaCom(findFirst))).resolves.toBe(aberto);
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0][0].where.status.in).toEqual([
      CampeonatoStatus.INSCRICOES_ABERTAS,
      CampeonatoStatus.EM_ANDAMENTO,
    ]);
  });

  it('sem aberto, usa o mais recente', async () => {
    const findFirst = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(recente);

    await expect(findCampeonatoAtual(prismaCom(findFirst))).resolves.toBe(recente);
    expect(findFirst.mock.calls[1][0].where).toBeUndefined();
  });

  it('modo público ignora rascunhos no fallback', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);

    await findCampeonatoAtual(prismaCom(findFirst), { publico: true });
    expect(findFirst.mock.calls[1][0].where).toEqual({
      status: { not: CampeonatoStatus.RASCUNHO },
    });
  });
});
