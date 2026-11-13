import { BadRequestException, ConflictException } from '@nestjs/common';
import { GestaoService } from './gestao.service';
import { recalcularRanking } from './sorteio/ranking';

jest.mock('./sorteio/ranking', () => ({ recalcularRanking: jest.fn() }));

describe('GestaoService', () => {
  const camp = { id: 'camp-1', status: 'EM_ANDAMENTO' };
  let prisma: any;
  let sorteio: { getRodadaDetalhe: jest.Mock };
  let service: GestaoService;

  beforeEach(() => {
    (recalcularRanking as jest.Mock).mockClear();
    prisma = {
      campeonato: { findFirst: jest.fn().mockResolvedValue(camp) },
      rodada: {
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      mesaTorneio: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { numeroMesa: 2 } }),
      },
      mesaTorneioJogador: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      inscricao: { findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
      ajustePontos: { create: jest.fn(), findMany: jest.fn() },
      grupoCampeonato: { findFirst: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    sorteio = { getRodadaDetalhe: jest.fn().mockResolvedValue({ id: 'r-1' }) };
    service = new GestaoService(prisma, sorteio as never, {} as never);
  });

  const rodada = (over: Record<string, unknown> = {}) => ({
    id: 'r-1',
    campeonatoId: 'camp-1',
    numero: 1,
    finalizada: false,
    ...over,
  });
  const mesa = (finalizada = false) => ({
    id: 'm-2',
    rodadaId: 'r-1',
    rodada: rodada({ finalizada }),
  });

  it('reabrir bloqueia se existe rodada posterior com mesas', async () => {
    prisma.rodada.findFirst
      .mockResolvedValueOnce(rodada({ finalizada: true }))
      .mockResolvedValueOnce(rodada({ id: 'r-2', numero: 2 }));

    await expect(service.reabrirRodada('r-1')).rejects.toThrow(ConflictException);
    expect(recalcularRanking).not.toHaveBeenCalled();
  });

  it('reabrir desfaz finalização e recalcula ranking', async () => {
    prisma.rodada.findFirst
      .mockResolvedValueOnce(rodada({ finalizada: true }))
      .mockResolvedValueOnce(null);

    await service.reabrirRodada('r-1');

    expect(prisma.rodada.update).toHaveBeenCalledWith({
      where: { id: 'r-1' },
      data: { finalizada: false, ativa: true },
    });
    expect(recalcularRanking).toHaveBeenCalledWith(prisma, 'camp-1');
  });

  it('excluir rodada finalizada é bloqueado', async () => {
    prisma.rodada.findFirst.mockResolvedValue(rodada({ finalizada: true }));
    await expect(service.excluirRodada('r-1')).rejects.toThrow(ConflictException);
    expect(prisma.rodada.delete).not.toHaveBeenCalled();
  });

  it('não altera estrutura de mesas em rodada finalizada', async () => {
    prisma.mesaTorneio.findFirst.mockResolvedValue(mesa(true));
    await expect(service.excluirMesa('m-2')).rejects.toThrow(ConflictException);
  });

  it('colocarJogador move de outra mesa e invalida as duas', async () => {
    prisma.mesaTorneio.findFirst.mockResolvedValue(mesa());
    prisma.inscricao.findFirst.mockResolvedValue({ id: 'ins-1' });
    prisma.mesaTorneioJogador.findFirst.mockResolvedValue({ id: 'j-1', mesaId: 'm-1' });
    prisma.mesaTorneioJogador.count.mockResolvedValue(3);

    await service.colocarJogador('m-2', { inscricaoId: 'ins-1' });

    expect(prisma.mesaTorneioJogador.delete).toHaveBeenCalledWith({ where: { id: 'j-1' } });
    expect(prisma.mesaTorneioJogador.create).toHaveBeenCalledWith({
      data: { mesaId: 'm-2', inscricaoId: 'ins-1' },
    });
    const invalidadas = prisma.mesaTorneio.update.mock.calls.map((c: any) => c[0].where.id);
    expect(invalidadas).toEqual(['m-1', 'm-2']);
  });

  it('colocarJogador recusa mesa cheia', async () => {
    prisma.mesaTorneio.findFirst.mockResolvedValue(mesa());
    prisma.inscricao.findFirst.mockResolvedValue({ id: 'ins-1' });
    prisma.mesaTorneioJogador.findFirst.mockResolvedValue(null);
    prisma.mesaTorneioJogador.count.mockResolvedValue(5);

    await expect(
      service.colocarJogador('m-2', { inscricaoId: 'ins-1' }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.mesaTorneioJogador.create).not.toHaveBeenCalled();
  });

  it('limpar resultado em rodada finalizada recalcula ranking', async () => {
    prisma.mesaTorneio.findFirst.mockResolvedValue(mesa(true));
    await service.limparResultado('m-2');
    expect(recalcularRanking).toHaveBeenCalledWith(prisma, 'camp-1');
  });

  it('ajustarPontos recusa zero', async () => {
    prisma.inscricao.findFirst.mockResolvedValue({ id: 'ins-1' });
    await expect(
      service.ajustarPontos('ins-1', { delta: 0, motivo: 'teste' }, 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('ajustarPontos registra log, incrementa ajuste e recalcula', async () => {
    prisma.inscricao.findFirst.mockResolvedValue({ id: 'ins-1' });
    prisma.ajustePontos.create.mockResolvedValue({
      id: 'a-1',
      delta: -2,
      motivo: 'Penalidade',
      adminUserId: 'admin',
      createdAt: new Date(),
    });

    const res = await service.ajustarPontos('ins-1', { delta: -2, motivo: ' Penalidade ' }, 'admin');

    expect(prisma.ajustePontos.create).toHaveBeenCalledWith({
      data: { inscricaoId: 'ins-1', delta: -2, motivo: 'Penalidade', adminUserId: 'admin' },
    });
    expect(prisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'ins-1' },
      data: { pontosAjuste: { increment: -2 } },
    });
    expect(recalcularRanking).toHaveBeenCalledWith(prisma, 'camp-1');
    expect(res.delta).toBe(-2);
  });

  it('atualizarInscricao permite precon banido (admin)', async () => {
    const validate = jest.fn().mockResolvedValue({
      preconId: 'p-2',
      preconComandanteId: 'c-2',
      preconComandante2Id: null,
    });
    const svc = new GestaoService(prisma, sorteio as never, { validateForInscricao: validate } as never);
    prisma.inscricao.findFirst.mockResolvedValue({
      id: 'ins-1',
      preconId: 'p-1',
      preconComandanteId: 'c-1',
      preconComandante2Id: null,
    });

    await svc.atualizarInscricao('ins-1', { preconId: 'p-2', preconComandanteId: 'c-2' });

    expect(validate).toHaveBeenCalledWith('p-2', 'c-2', null, true);
    expect(prisma.inscricao.update).toHaveBeenCalled();
  });

  it('removerInscricao bloqueia quando já participou de mesas', async () => {
    prisma.inscricao.findFirst.mockResolvedValue({ id: 'ins-1' });
    prisma.mesaTorneioJogador.count.mockResolvedValue(1);
    await expect(service.removerInscricao('ins-1')).rejects.toThrow(ConflictException);
    expect(prisma.inscricao.delete).not.toHaveBeenCalled();
  });
});
