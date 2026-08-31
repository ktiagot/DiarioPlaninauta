import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from '../precons/precons.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { MesasService } from './mesas.service';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const USER_ID = 'user-1';
const OTHER_USER = 'user-2';
const MESA_ID = 'mesa-1';

function fakeMesa(overrides: Record<string, unknown> = {}) {
  return {
    id: MESA_ID,
    nome: 'Sexta à Noite',
    descricao: null,
    dataHora: new Date('2026-09-01T23:00:00Z'),
    linkPartida: null,
    finalizada: false,
    finalizadaEm: null,
    criadorUserId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    jogadores: [],
    eliminacoes: [],
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Test suite                                                        */
/* ------------------------------------------------------------------ */
describe('MesasService', () => {
  let service: MesasService;
  let prisma: {
    mesa: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    mesaJogador: { update: jest.Mock; create: jest.Mock; delete: jest.Mock };
    eliminacao: { createMany: jest.Mock };
    user: { findUnique: jest.Mock };
    notificacao: { createMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let precons: { validateOptionalForMesa: jest.Mock };
  const notificacoes = { criar: jest.fn() };

  beforeEach(async () => {
    prisma = {
      mesa: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      mesaJogador: { update: jest.fn(), create: jest.fn(), delete: jest.fn() },
      eliminacao: { createMany: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ nick: 'fulano' }) },
      notificacao: { createMany: jest.fn() },
      $transaction: jest.fn(),
    };

    precons = {
      validateOptionalForMesa: jest.fn().mockResolvedValue({
        preconId: null,
        preconComandanteId: null,
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        MesasService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreconsService, useValue: precons },
        { provide: NotificacoesService, useValue: notificacoes },
      ],
    }).compile();

    service = module.get(MesasService);
  });

  /* ============================================================== */
  /*  create                                                        */
  /* ============================================================== */
  describe('create', () => {
    it('cria mesa com criadorUserId e dataHora', async () => {
      const mesa = fakeMesa();
      prisma.mesa.create.mockResolvedValue(mesa);

      const result = await service.create(USER_ID, {
        nome: 'Sexta à Noite',
        dataHora: '2026-09-01T23:00:00.000Z',
      });

      expect(prisma.mesa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            criadorUserId: USER_ID,
            dataHora: expect.any(Date),
          }),
        }),
      );
      expect(result.nome).toBe('Sexta à Noite');
    });
  });

  /* ============================================================== */
  /*  update                                                        */
  /* ============================================================== */
  describe('update', () => {
    it('atualiza link e descricao', async () => {
      const mesa = fakeMesa();
      prisma.mesa.findUnique.mockResolvedValue(mesa);
      prisma.mesa.update.mockResolvedValue({ ...mesa, linkPartida: 'https://x.com' });

      const result = await service.update(MESA_ID, USER_ID, {
        dataHora: '2026-09-02T20:00:00.000Z',
        linkPartida: 'https://x.com',
        descricao: 'nova desc',
      });

      expect(prisma.mesa.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dataHora: expect.any(Date),
            linkPartida: 'https://x.com',
            descricao: 'nova desc',
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('rejeita se não é dono', async () => {
      prisma.mesa.findUnique.mockResolvedValue(fakeMesa());

      await expect(
        service.update(MESA_ID, OTHER_USER, {
          dataHora: '2026-09-02T20:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita se mesa finalizada', async () => {
      prisma.mesa.findUnique.mockResolvedValue(fakeMesa({ finalizada: true }));

      await expect(
        service.update(MESA_ID, USER_ID, {
          dataHora: '2026-09-02T20:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejeita se mesa não encontrada', async () => {
      prisma.mesa.findUnique.mockResolvedValue(null);

      await expect(
        service.update(MESA_ID, USER_ID, {
          dataHora: '2026-09-02T20:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  /* ============================================================== */
  /*  updateLink                                                    */
  /* ============================================================== */
  describe('updateLink', () => {
    it('atualiza link quando é dono e mesa aberta', async () => {
      const mesa = fakeMesa();
      prisma.mesa.findUnique.mockResolvedValue(mesa);
      prisma.mesa.update.mockResolvedValue({ ...mesa, linkPartida: 'https://new.link' });

      const result = await service.updateLink(MESA_ID, USER_ID, {
        linkPartida: 'https://new.link',
      });

      expect(result).toBeDefined();
    });

    it('rejeita se não é dono', async () => {
      prisma.mesa.findUnique.mockResolvedValue(fakeMesa());

      await expect(
        service.updateLink(MESA_ID, OTHER_USER, { linkPartida: 'https://x.com' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  /* ============================================================== */
  /*  fechar                                                        */
  /* ============================================================== */
  describe('fechar', () => {
    it('marca mesa como finalizada com finalizadaEm', async () => {
      const mesa = fakeMesa();
      prisma.mesa.findUnique.mockResolvedValue(mesa);
      prisma.mesa.update.mockResolvedValue({
        ...mesa,
        finalizada: true,
        finalizadaEm: new Date(),
      });

      const result = await service.fechar(MESA_ID, USER_ID);

      expect(prisma.mesa.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            finalizada: true,
            finalizadaEm: expect.any(Date),
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('rejeita fechar mesa já finalizada', async () => {
      prisma.mesa.findUnique.mockResolvedValue(fakeMesa({ finalizada: true }));

      await expect(service.fechar(MESA_ID, USER_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejeita se não é dono', async () => {
      prisma.mesa.findUnique.mockResolvedValue(fakeMesa());

      await expect(service.fechar(MESA_ID, OTHER_USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  /* ============================================================== */
  /*  entrar                                                        */
  /* ============================================================== */
  describe('entrar', () => {
    it('cria jogador e notifica dono + participantes (menos quem entrou)', async () => {
      const mesa = fakeMesa({
        criadorUserId: USER_ID,
        jogadores: [{ userId: USER_ID }],
      });
      prisma.mesa.findUnique.mockResolvedValue(mesa);
      prisma.user.findUnique.mockResolvedValue({ nick: 'novato' });
      prisma.mesa.findUniqueOrThrow.mockResolvedValue(
        fakeMesa({ jogadores: [{ userId: USER_ID, user: { id: USER_ID, nome: 'A', sobrenome: 'B', nick: 'a' } }, { userId: OTHER_USER, user: { id: OTHER_USER, nome: 'N', sobrenome: 'O', nick: 'novato' } }] }),
      );

      await service.entrar(MESA_ID, OTHER_USER);

      expect(prisma.mesaJogador.create).toHaveBeenCalledWith({
        data: { mesaId: MESA_ID, userId: OTHER_USER },
      });
      expect(prisma.notificacao.createMany).toHaveBeenCalledTimes(1);
      const arg = prisma.notificacao.createMany.mock.calls[0][0];
      expect(arg.data).toEqual([
        expect.objectContaining({ userId: USER_ID, tipo: 'mesa_entrou' }),
      ]);
      expect(arg.data[0].mensagem).toContain('novato');
    });

    it('rejeita entrar em mesa cheia', async () => {
      const cheia = fakeMesa({
        jogadores: [
          { userId: 'a' },
          { userId: 'b' },
          { userId: 'c' },
          { userId: 'd' },
        ],
      });
      prisma.mesa.findUnique.mockResolvedValue(cheia);

      await expect(service.entrar(MESA_ID, OTHER_USER)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejeita entrar se já participa', async () => {
      prisma.mesa.findUnique.mockResolvedValue(
        fakeMesa({ jogadores: [{ userId: OTHER_USER }] }),
      );

      await expect(service.entrar(MESA_ID, OTHER_USER)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  /* ============================================================== */
  /*  notificarMesasDeHoje                                          */
  /* ============================================================== */
  describe('notificarMesasDeHoje', () => {
    it('notifica jogadores de mesas de hoje', async () => {
      const hoje = new Date();
      prisma.mesa.findMany.mockResolvedValue([
        {
          ...fakeMesa({ dataHora: hoje }),
          jogadores: [{ userId: USER_ID }, { userId: OTHER_USER }],
        },
      ]);
      prisma.notificacao.createMany.mockResolvedValue({ count: 2 });

      const count = await service.notificarMesasDeHoje();

      expect(count).toBe(2);
      const arg = prisma.notificacao.createMany.mock.calls[0][0];
      expect(arg.data).toHaveLength(2);
      expect(arg.data[0]).toMatchObject({ tipo: 'dia_do_evento' });
    });

    it('retorna 0 quando não há mesas hoje', async () => {
      prisma.mesa.findMany.mockResolvedValue([]);
      const count = await service.notificarMesasDeHoje();
      expect(count).toBe(0);
    });
  });

  /* ============================================================== */
  /*  limparMesasExpiradas                                          */
  /* ============================================================== */
  describe('limparMesasExpiradas', () => {
    it('chama deleteMany com regras de 1h (finalizada) e 24h (dataHora)', async () => {
      prisma.mesa.deleteMany.mockResolvedValue({ count: 3 });

      const antes = Date.now();
      const removidas = await service.limparMesasExpiradas();
      const depois = Date.now();

      expect(removidas).toBe(3);
      expect(prisma.mesa.deleteMany).toHaveBeenCalledTimes(1);

      const where = prisma.mesa.deleteMany.mock.calls[0][0].where;
      expect(where.OR).toHaveLength(2);

      // Regra 1: finalizada + finalizadaEm < agora - 1h
      const regra1h = where.OR[0];
      expect(regra1h.finalizada).toBe(true);
      const limiteFinalizacao = regra1h.finalizadaEm.lt.getTime();
      const esperado1h = antes - 60 * 60 * 1000;
      expect(limiteFinalizacao).toBeGreaterThanOrEqual(esperado1h - 100);
      expect(limiteFinalizacao).toBeLessThanOrEqual(depois - 60 * 60 * 1000 + 100);

      // Regra 2: dataHora < agora - 24h
      const regra24h = where.OR[1];
      const limiteDataHora = regra24h.dataHora.lt.getTime();
      const esperado24h = antes - 24 * 60 * 60 * 1000;
      expect(limiteDataHora).toBeGreaterThanOrEqual(esperado24h - 100);
      expect(limiteDataHora).toBeLessThanOrEqual(depois - 24 * 60 * 60 * 1000 + 100);
    });

    it('retorna 0 quando nada é removido', async () => {
      prisma.mesa.deleteMany.mockResolvedValue({ count: 0 });

      const removidas = await service.limparMesasExpiradas();

      expect(removidas).toBe(0);
    });
  });
});
