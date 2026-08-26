import {
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';
import { ComunidadeService } from './comunidade.service';

function user(over: Partial<{
  id: string;
  email: string;
  nome: string;
  nick: string;
  isApoiadorAtivo: boolean;
  isExApoiador: boolean;
  lastValidationAt: Date | null;
  monthlyContribution: number | null;
  apoiandoDesde: Date | null;
}> = {}) {
  return {
    id: over.id ?? 'u1',
    email: over.email ?? 'jogador@email.com',
    nome: over.nome ?? 'João',
    nick: over.nick ?? 'joaosilva',
    isApoiadorAtivo: over.isApoiadorAtivo ?? false,
    isExApoiador: over.isExApoiador ?? false,
    lastValidationAt: over.lastValidationAt ?? null,
    monthlyContribution: over.monthlyContribution ?? null,
    apoiandoDesde: over.apoiandoDesde ?? null,
  };
}

function createTestingModule(prisma: object, apoiase: object) {
  return Test.createTestingModule({
    providers: [
      ComunidadeService,
      { provide: PrismaService, useValue: prisma },
      { provide: ApoiaSeService, useValue: apoiase },
    ],
  }).compile();
}

describe('ComunidadeService admin jogadores / APOIA.se', () => {
  let service: ComunidadeService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let apoiase: { verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    apoiase = { verify: jest.fn() };

    const module = await createTestingModule(prisma, apoiase);
    service = module.get(ComunidadeService);
  });

  describe('listAdminJogadores', () => {
    it('retorna todos os usuários ordenados por nome', async () => {
      const rows = [user({ nome: 'Ana' }), user({ id: 'u2', nome: 'Bruno', email: 'b@e.com' })];
      prisma.user.findMany.mockResolvedValue(rows);

      const result = await service.listAdminJogadores();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          nome: true,
          nick: true,
          isApoiadorAtivo: true,
          isExApoiador: true,
          lastValidationAt: true,
          monthlyContribution: true,
        },
        orderBy: { nome: 'asc' },
      });
      expect(result).toEqual(rows);
    });
  });

  describe('verificarESincronizar', () => {
    it('404 quando e-mail não existe no banco', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.verificarESincronizar('x@e.com')).rejects.toThrow(
        NotFoundException,
      );
      expect(apoiase.verify).not.toHaveBeenCalled();
    });

    it('sincroniza apoiador ativo (isBacker + pago no mês)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', apoiandoDesde: null });
      apoiase.verify.mockResolvedValue({
        isBacker: true,
        isPaidThisMonth: true,
        thisMonthPaidValue: 15,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.verificarESincronizar('jogador@email.com');

      expect(result).toEqual({
        email: 'jogador@email.com',
        ativo: true,
        isBacker: true,
        isPaidThisMonth: true,
        thisMonthPaidValue: 15,
        apiIndisponivel: false,
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'jogador@email.com' },
          data: expect.objectContaining({
            isApoiadorAtivo: true,
            isExApoiador: false,
            monthlyContribution: 15,
            apoiandoDesde: expect.any(Date),
          }),
        }),
      );
    });

    it('marca ex-apoiador quando isBacker=false', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', apoiandoDesde: new Date() });
      apoiase.verify.mockResolvedValue({
        isBacker: false,
        isPaidThisMonth: false,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.verificarESincronizar('jogador@email.com');

      expect(result.ativo).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isApoiadorAtivo: false,
            isExApoiador: true,
          }),
        }),
      );
    });

    it('inativo quando backer sem pagamento do mês', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', apoiandoDesde: new Date() });
      apoiase.verify.mockResolvedValue({
        isBacker: true,
        isPaidThisMonth: false,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.verificarESincronizar('jogador@email.com');

      expect(result.ativo).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isApoiadorAtivo: false,
            isExApoiador: false,
          }),
        }),
      );
    });

    it('retorna apiIndisponivel sem alterar banco quando APOIA.se falha', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', apoiandoDesde: null });
      apoiase.verify.mockRejectedValue(
        new ServiceUnavailableException('Serviço indisponível.'),
      );

      const result = await service.verificarESincronizar('jogador@email.com');

      expect(result).toEqual({
        email: 'jogador@email.com',
        ativo: false,
        isBacker: false,
        isPaidThisMonth: false,
        thisMonthPaidValue: null,
        apiIndisponivel: true,
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('não sobrescreve apoiandoDesde se já existir', async () => {
      const desde = new Date('2025-01-01');
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', apoiandoDesde: desde });
      apoiase.verify.mockResolvedValue({
        isBacker: true,
        isPaidThisMonth: true,
        thisMonthPaidValue: 15,
      });
      prisma.user.update.mockResolvedValue({});

      await service.verificarESincronizar('jogador@email.com');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ apoiandoDesde: expect.any(Date) }),
        }),
      );
    });
  });
});
