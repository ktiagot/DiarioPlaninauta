import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from '../precons/precons.service';
import { PrecompeonatoService } from './precompeonato.service';

function camp(over: Partial<{ id: string; status: CampeonatoStatus }> = {}) {
  return {
    id: over.id ?? 'c1',
    nome: 'Precompeonato #1',
    edicao: '#1',
    dataInicio: new Date('2026-09-01T00:00:00.000Z'),
    descricao: null,
    bannerUrl: null,
    status: over.status ?? CampeonatoStatus.EM_ANDAMENTO,
    inscricoesAbertasAte: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date(),
  };
}

function inscricao(over: Partial<{
  id: string;
  ativo: boolean;
  pontos: number;
  posicao: number | null;
  email: string;
  mesas: { posicaoFinal: number | null }[];
}> = {}) {
  return {
    id: over.id ?? 'ins-1',
    campeonatoId: 'c1',
    userId: 'u1',
    email: over.email ?? 'jogador@email.com',
    discordNick: 'nick#1234',
    deckUrl: null,
    preconId: 'precon-1',
    preconComandanteId: 'cmd-1',
    precon: { nome: 'Precon Atraxa' },
    preconComandante: { comandante: 'Atraxa' },
    aceiteTermos: true,
    aceiteTermosEm: new Date(),
    aceitePrivacidade: true,
    entrouDiscord: true,
    ativo: over.ativo ?? true,
    pontos: over.pontos ?? 6,
    posicao: over.posicao ?? 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { nome: 'João', nick: 'joaosilva' },
    mesas: over.mesas ?? [{ posicaoFinal: 1 }, { posicaoFinal: 2 }],
  };
}

describe('PrecompeonatoService inscritos admin', () => {
  let service: PrecompeonatoService;
  let prisma: {
    campeonato: { findFirst: jest.Mock };
    inscricao: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
    };
    rodada: { findMany: jest.Mock };
    checkInRodada: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      campeonato: { findFirst: jest.fn() },
      inscricao: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      rodada: { findMany: jest.fn() },
      checkInRodada: { deleteMany: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<void>) =>
        fn(prisma),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        PrecompeonatoService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: PreconsService,
          useValue: {
            validateForInscricao: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PrecompeonatoService);
    prisma.campeonato.findFirst.mockResolvedValue(camp());
  });

  it('listInscritosAdmin retorna ativos e suspensos com email e vitorias', async () => {
    prisma.inscricao.findMany.mockResolvedValue([
      inscricao({ id: 'ins-1', ativo: true, email: 'a@email.com', mesas: [{ posicaoFinal: 1 }] }),
      inscricao({
        id: 'ins-2',
        ativo: false,
        email: 'b@email.com',
        pontos: 3,
        posicao: 2,
        mesas: [],
      }),
    ]);

    const result = await service.listInscritosAdmin();

    expect(result).toHaveLength(2);
    expect(result[0].ativo).toBe(true);
    expect(result[0].email).toBe('a@email.com');
    expect(result[0].vitorias).toBe(1);
    expect(result[1].ativo).toBe(false);
    expect(result[1].vitorias).toBe(0);
  });

  it('setInscricaoAtivo suspende e remove check-in pendente', async () => {
    const row = inscricao({ ativo: true });
    prisma.inscricao.findFirst.mockResolvedValue(row);
    prisma.inscricao.update.mockResolvedValue({ ...row, ativo: false });
    prisma.inscricao.findUniqueOrThrow.mockResolvedValue({
      ...row,
      ativo: false,
      mesas: row.mesas,
    });
    prisma.rodada.findMany.mockResolvedValue([
      { id: 'r1', _count: { mesas: 0 } },
    ]);

    const result = await service.setInscricaoAtivo('ins-1', false);

    expect(prisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'ins-1' },
      data: { ativo: false },
    });
    expect(prisma.checkInRodada.deleteMany).toHaveBeenCalledWith({
      where: { rodadaId: 'r1', inscricaoId: 'ins-1' },
    });
    expect(result.ativo).toBe(false);
  });

  it('setInscricaoAtivo reativa inscrição', async () => {
    const row = inscricao({ ativo: false });
    prisma.inscricao.findFirst.mockResolvedValue(row);
    prisma.inscricao.update.mockResolvedValue({ ...row, ativo: true });
    prisma.inscricao.findUniqueOrThrow.mockResolvedValue({
      ...row,
      ativo: true,
      mesas: row.mesas,
    });

    const result = await service.setInscricaoAtivo('ins-1', true);

    expect(prisma.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'ins-1' },
      data: { ativo: true },
    });
    expect(prisma.checkInRodada.deleteMany).not.toHaveBeenCalled();
    expect(result.ativo).toBe(true);
  });

  it('setInscricaoAtivo idempotente quando valor já é o atual', async () => {
    const row = inscricao({ ativo: false });
    prisma.inscricao.findFirst.mockResolvedValue(row);

    const result = await service.setInscricaoAtivo('ins-1', false);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.ativo).toBe(false);
  });

  it('setInscricaoAtivo rejeita campeonato encerrado', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(
      camp({ status: CampeonatoStatus.ENCERRADO }),
    );

    await expect(service.setInscricaoAtivo('ins-1', false)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('setInscricaoAtivo retorna 404 para inscrição inexistente', async () => {
    prisma.inscricao.findFirst.mockResolvedValue(null);

    await expect(service.setInscricaoAtivo('missing', false)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
