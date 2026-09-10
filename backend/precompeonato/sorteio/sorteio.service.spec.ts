import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SorteioService } from './sorteio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacoesService } from '../../notificacoes/notificacoes.service';

const RESULTADO_DTO = {
  jogadores: [
    { inscricaoId: 'ins-1', posicao: 1, kills: 2 },
    { inscricaoId: 'ins-2', posicao: 2, kills: 1 },
    { inscricaoId: 'ins-3', posicao: 3, kills: 0 },
  ],
};

function mesaBase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm-1',
    validada: false,
    validadaEm: null,
    empate: false,
    empatadosInscricaoIds: [] as string[],
    linkPartida: null,
    rodada: { id: 'r-1', finalizada: false },
    jogadores: [
      { inscricaoId: 'ins-1', posicaoFinal: null, inscricao: { userId: 'user-1' } },
      { inscricaoId: 'ins-2', posicaoFinal: null, inscricao: { userId: 'user-2' } },
      { inscricaoId: 'ins-3', posicaoFinal: null, inscricao: { userId: 'user-3' } },
    ],
    ...overrides,
  };
}

describe('SorteioService', () => {
  let service: SorteioService;
  let prisma: {
    campeonato: { findFirst: jest.Mock };
    rodada: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    checkInRodada: { findMany: jest.Mock };
    mesaTorneio: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
      update: jest.Mock;
    };
    mesaTorneioJogador: { updateMany: jest.Mock; findMany: jest.Mock };
    inscricao: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    notificacao: { createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      campeonato: { findFirst: jest.fn() },
      rodada: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      checkInRodada: { findMany: jest.fn() },
      mesaTorneio: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      },
      mesaTorneioJogador: {
        updateMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      inscricao: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      notificacao: { createMany: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SorteioService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificacoesService, useValue: { criar: jest.fn() } },
      ],
    }).compile();

    service = module.get(SorteioService);
  });

  function stubGetRodadaAtual(validada: boolean) {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      status: 'EM_ANDAMENTO',
    });
    prisma.rodada.findFirst.mockResolvedValue({
      id: 'r-1',
      numero: 1,
      dataRodada: new Date('2026-08-26T12:00:00.000Z'),
      ativa: true,
      finalizada: false,
    });
    prisma.mesaTorneio.findMany.mockResolvedValue([
      {
        id: 'm-1',
        numeroMesa: 1,
        validada,
        validadaEm: validada ? new Date('2026-08-26T12:00:00.000Z') : null,
        linkPartida: null,
        empate: false,
        empatadosInscricaoIds: [],
        jogadores: RESULTADO_DTO.jogadores.map((j) => ({
          posicaoFinal: j.posicao,
          kills: j.kills,
          inscricao: {
            id: j.inscricaoId,
            discordNick: 'n',
            precon: { nome: 'Deck' },
            preconComandante: { comandante: 'A' },
            deckUrl: null,
            posicao: 1,
            user: { nome: 'N', nick: 'n' },
          },
        })),
      },
    ]);
  }

  it('checkIn falha sem rodada aberta', async () => {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      status: 'EM_ANDAMENTO',
    });
    prisma.inscricao.findUnique.mockResolvedValue({
      id: 'ins-1',
      ativo: true,
    });
    prisma.rodada.findMany.mockResolvedValue([]);

    await expect(service.checkIn('user-1')).rejects.toThrow(ConflictException);
  });

  it('abrirRodada bloqueia se já existe rodada em check-in', async () => {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      nome: 'Test',
      status: 'EM_ANDAMENTO',
    });
    prisma.rodada.findMany.mockResolvedValue([
      { id: 'r-open', numero: 2, finalizada: false, _count: { mesas: 0 } },
    ]);

    await expect(
      service.abrirRodada({ numero: 3, dataRodada: '2026-08-26' }),
    ).rejects.toThrow(ConflictException);
  });

  it('reSortearMesas bloqueia quando há resultado', async () => {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      status: 'EM_ANDAMENTO',
    });
    prisma.rodada.findMany.mockImplementation(({ orderBy }: { orderBy: { numero: string } }) => {
      if (orderBy?.numero === 'desc') {
        return Promise.resolve([
          { id: 'r-2', numero: 2, finalizada: false, _count: { mesas: 1 } },
        ]);
      }
      return Promise.resolve([]);
    });
    prisma.mesaTorneio.findMany.mockResolvedValue([
      {
        id: 'm-1',
        jogadores: [{ posicaoFinal: 1 }],
      },
    ]);

    await expect(service.reSortearMesas()).rejects.toThrow(ConflictException);
  });

  it('jogador de fora da mesa não pode gravar resultado', async () => {
    prisma.mesaTorneio.findUnique.mockResolvedValue(mesaBase());

    await expect(
      service.submitMesaResultado('m-1', RESULTADO_DTO, {
        id: 'user-99',
        isAdmin: false,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('jogador da mesa grava resultado sem validar', async () => {
    prisma.mesaTorneio.findUnique.mockResolvedValue(mesaBase());
    stubGetRodadaAtual(false);

    const result = await service.submitMesaResultado('m-1', RESULTADO_DTO, {
      id: 'user-1',
      isAdmin: false,
    });

    expect(prisma.mesaTorneio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ validada: false }),
      }),
    );
    expect(result.mesas[0].validada).toBe(false);
  });

  it('jogador pode editar de novo enquanto a mesa não foi validada', async () => {
    prisma.mesaTorneio.findUnique.mockResolvedValue(
      mesaBase({
        jogadores: [
          { inscricaoId: 'ins-1', posicaoFinal: 1, inscricao: { userId: 'user-1' } },
          { inscricaoId: 'ins-2', posicaoFinal: 2, inscricao: { userId: 'user-2' } },
          { inscricaoId: 'ins-3', posicaoFinal: 3, inscricao: { userId: 'user-3' } },
        ],
      }),
    );
    stubGetRodadaAtual(false);

    await expect(
      service.submitMesaResultado('m-1', RESULTADO_DTO, {
        id: 'user-2',
        isAdmin: false,
      }),
    ).resolves.toMatchObject({ mesas: [expect.objectContaining({ validada: false })] });
  });

  it('admin lança mesa sem reporte e já valida', async () => {
    prisma.mesaTorneio.findUnique.mockResolvedValue(mesaBase());
    stubGetRodadaAtual(true);

    const result = await service.submitMesaResultado('m-1', RESULTADO_DTO, {
      id: 'admin-1',
      isAdmin: true,
    });

    expect(prisma.mesaTorneio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ validada: true }),
      }),
    );
    expect(result.mesas[0].validada).toBe(true);
  });

  it('jogador não pode gravar depois que a mesa foi validada', async () => {
    prisma.mesaTorneio.findUnique.mockResolvedValue(mesaBase({ validada: true }));

    await expect(
      service.submitMesaResultado('m-1', RESULTADO_DTO, {
        id: 'user-1',
        isAdmin: false,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('admin pode corrigir mesa validada antes de finalizar a rodada', async () => {
    prisma.mesaTorneio.findUnique.mockResolvedValue(mesaBase({ validada: true }));
    stubGetRodadaAtual(true);

    await expect(
      service.submitMesaResultado('m-1', RESULTADO_DTO, {
        id: 'admin-1',
        isAdmin: true,
      }),
    ).resolves.toMatchObject({ mesas: [expect.objectContaining({ validada: true })] });
  });

  it('getRodadaAtual só permite finalizar quando todas as mesas estão validadas', async () => {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      status: 'EM_ANDAMENTO',
    });
    prisma.rodada.findFirst.mockResolvedValue({
      id: 'r-1',
      numero: 1,
      dataRodada: new Date('2026-08-26T12:00:00.000Z'),
      ativa: true,
      finalizada: false,
    });
    prisma.mesaTorneio.findMany.mockResolvedValue([
      {
        id: 'm-1',
        numeroMesa: 1,
        validada: false,
        validadaEm: null,
        linkPartida: null,
        empate: false,
        empatadosInscricaoIds: [],
        jogadores: [
          {
            posicaoFinal: 1,
            kills: 1,
            inscricao: {
              id: 'ins-1',
              discordNick: 'n',
              precon: { nome: 'D' },
              preconComandante: { comandante: 'A' },
              deckUrl: null,
              posicao: 1,
              user: { nome: 'N', nick: 'n' },
            },
          },
        ],
      },
    ]);

    const result = await service.getRodadaAtual();
    expect(result?.podeFinalizar).toBe(false);
  });

  it('finalizarRodada bloqueia se houver mesa não validada', async () => {
    prisma.rodada.findUnique.mockResolvedValue({
      id: 'r-1',
      finalizada: false,
      mesas: [
        {
          validada: false,
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [{ inscricaoId: 'ins-1', posicaoFinal: 1 }],
        },
      ],
    });

    await expect(service.finalizarRodada('r-1')).rejects.toThrow(ConflictException);
  });

  // Coleta os deltas de pontos aplicados via tx.inscricao.update({ increment }).
  function capturarPontos(): Map<string, number> {
    const deltas = new Map<string, number>();
    for (const call of prisma.inscricao.update.mock.calls) {
      const arg = call[0] as {
        where: { id: string };
        data: { pontos?: { increment?: number }; posicao?: number };
      };
      if (arg.data?.pontos?.increment !== undefined) {
        deltas.set(arg.where.id, arg.data.pontos.increment);
      }
    }
    return deltas;
  }

  it('finalizarRodada soma 3 ao 1º, 1 ao 2º e nada ao 3º/4º', async () => {
    prisma.rodada.findUnique.mockResolvedValue({
      id: 'r-1',
      campeonatoId: 'camp-1',
      numero: 1,
      finalizada: false,
      mesas: [
        {
          validada: true,
          validadaEm: new Date(),
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [
            { inscricaoId: 'ins-1', posicaoFinal: 1 },
            { inscricaoId: 'ins-2', posicaoFinal: 2 },
            { inscricaoId: 'ins-3', posicaoFinal: 3 },
            { inscricaoId: 'ins-4', posicaoFinal: 4 },
          ],
        },
      ],
    });
    prisma.inscricao.findMany.mockResolvedValue([]);
    stubGetRodadaAtual(true);

    await service.finalizarRodada('r-1');

    const deltas = capturarPontos();
    expect(deltas.get('ins-1')).toBe(3);
    expect(deltas.get('ins-2')).toBe(1);
    // 3º e 4º não recebem update de pontos (delta 0 é pulado).
    expect(deltas.has('ins-3')).toBe(false);
    expect(deltas.has('ins-4')).toBe(false);
  });

  it('finalizarRodada em empate soma 1 a cada empatado e ignora posições', async () => {
    prisma.rodada.findUnique.mockResolvedValue({
      id: 'r-1',
      campeonatoId: 'camp-1',
      numero: 1,
      finalizada: false,
      mesas: [
        {
          validada: true,
          validadaEm: new Date(),
          empate: true,
          empatadosInscricaoIds: ['ins-1', 'ins-2'],
          jogadores: [
            { inscricaoId: 'ins-1', posicaoFinal: 1 },
            { inscricaoId: 'ins-2', posicaoFinal: 1 },
            { inscricaoId: 'ins-3', posicaoFinal: 3 },
          ],
        },
      ],
    });
    prisma.inscricao.findMany.mockResolvedValue([]);
    stubGetRodadaAtual(true);

    await service.finalizarRodada('r-1');

    const deltas = capturarPontos();
    expect(deltas.get('ins-1')).toBe(1);
    expect(deltas.get('ins-2')).toBe(1);
    expect(deltas.has('ins-3')).toBe(false);
    // Ninguém recebe +3 num empate.
    expect([...deltas.values()]).not.toContain(3);
  });

  it('finalizarRodada acumula pontos de várias mesas por inscrição', async () => {
    prisma.rodada.findUnique.mockResolvedValue({
      id: 'r-1',
      campeonatoId: 'camp-1',
      numero: 2,
      finalizada: false,
      mesas: [
        {
          validada: true,
          validadaEm: new Date(),
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [
            { inscricaoId: 'ins-1', posicaoFinal: 1 },
            { inscricaoId: 'ins-2', posicaoFinal: 2 },
          ],
        },
        {
          validada: true,
          validadaEm: new Date(),
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [
            { inscricaoId: 'ins-2', posicaoFinal: 1 },
            { inscricaoId: 'ins-3', posicaoFinal: 2 },
          ],
        },
      ],
    });
    prisma.inscricao.findMany.mockResolvedValue([]);
    stubGetRodadaAtual(true);

    await service.finalizarRodada('r-1');

    const deltas = capturarPontos();
    // ins-1: 1º na mesa 1 = 3. ins-2: 2º (mesa 1, +1) + 1º (mesa 2, +3) = 4.
    // ins-3: 2º na mesa 2 = 1.
    expect(deltas.get('ins-1')).toBe(3);
    expect(deltas.get('ins-2')).toBe(4);
    expect(deltas.get('ins-3')).toBe(1);
  });

  it('finalizarRodada recalcula posições por pontos desc e marca finalizada', async () => {
    prisma.rodada.findUnique.mockResolvedValue({
      id: 'r-1',
      campeonatoId: 'camp-1',
      numero: 1,
      finalizada: false,
      mesas: [
        {
          validada: true,
          validadaEm: new Date(),
          empate: false,
          empatadosInscricaoIds: [],
          jogadores: [
            { inscricaoId: 'ins-1', posicaoFinal: 1 },
            { inscricaoId: 'ins-2', posicaoFinal: 2 },
          ],
        },
      ],
    });
    // Já ordenado por pontos desc (como o service consulta).
    prisma.inscricao.findMany.mockResolvedValue([
      { id: 'ins-1' },
      { id: 'ins-2' },
      { id: 'ins-3' },
    ]);
    stubGetRodadaAtual(true);

    await service.finalizarRodada('r-1');

    // posicao = índice + 1 na ordem retornada.
    const posicoes = new Map<string, number>();
    for (const call of prisma.inscricao.update.mock.calls) {
      const arg = call[0] as { where: { id: string }; data: { posicao?: number } };
      if (arg.data?.posicao !== undefined) posicoes.set(arg.where.id, arg.data.posicao);
    }
    expect(posicoes.get('ins-1')).toBe(1);
    expect(posicoes.get('ins-2')).toBe(2);
    expect(posicoes.get('ins-3')).toBe(3);

    expect(prisma.rodada.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'r-1' },
        data: expect.objectContaining({ finalizada: true, ativa: false }),
      }),
    );
  });

  it('abrirRodada bloqueia se a anterior tiver mesa não validada', async () => {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      nome: 'Test',
      status: 'EM_ANDAMENTO',
    });
    prisma.rodada.findMany.mockResolvedValue([]);
    prisma.rodada.findUnique.mockResolvedValue(null);
    prisma.rodada.findFirst.mockResolvedValue({
      id: 'r-1',
      numero: 1,
      finalizada: false,
      mesas: [
        {
          validada: false,
          jogadores: [{ posicaoFinal: 1 }],
        },
      ],
    });

    await expect(
      service.abrirRodada({ numero: 2, dataRodada: '2026-08-27' }),
    ).rejects.toThrow(ConflictException);
  });

  it('sortearMesas ignora check-ins de inscrições inativas', async () => {
    prisma.campeonato.findFirst.mockResolvedValue({
      id: 'camp-1',
      status: 'EM_ANDAMENTO',
    });
    prisma.rodada.findMany.mockImplementation(({ orderBy }: { orderBy?: { numero: string } }) => {
      if (orderBy?.numero === 'asc') {
        return Promise.resolve([
          { id: 'r-open', numero: 1, finalizada: false, _count: { mesas: 0 } },
        ]);
      }
      return Promise.resolve([]);
    });
    prisma.rodada.findFirst.mockResolvedValue(null);
    prisma.mesaTorneio.count.mockResolvedValue(0);
    prisma.checkInRodada.findMany.mockResolvedValue([
      {
        inscricaoId: 'ins-1',
        inscricao: {
          id: 'ins-1',
          pontos: 3,
          ativo: true,
          precon: { nome: 'A' },
          user: { nome: 'A', nick: 'a' },
        },
      },
      {
        inscricaoId: 'ins-2',
        inscricao: {
          id: 'ins-2',
          pontos: 3,
          ativo: false,
          precon: { nome: 'B' },
          user: { nome: 'B', nick: 'b' },
        },
      },
      {
        inscricaoId: 'ins-3',
        inscricao: {
          id: 'ins-3',
          pontos: 3,
          ativo: true,
          precon: { nome: 'C' },
          user: { nome: 'C', nick: 'c' },
        },
      },
    ]);

    await expect(service.sortearMesas()).rejects.toThrow(BadRequestException);
  });
});
