import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParceirosService } from './parceiros.service';

function parceiro(over: Partial<{ id: string; ativo: boolean; ordem: number }> = {}) {
  return {
    id: over.id ?? 'p1',
    nome: 'Liga Magic',
    descricao: null,
    logoUrl: null,
    url: 'https://ligamagic.com.br',
    ativo: over.ativo ?? true,
    ordem: over.ordem ?? 0,
    cliques: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('ParceirosService', () => {
  let service: ParceirosService;
  let prisma: {
    parceiro: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      parceiro: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [ParceirosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ParceirosService);
  });

  it('listarPublico só traz ativos, ordenados', async () => {
    prisma.parceiro.findMany.mockResolvedValue([parceiro()]);

    const res = await service.listarPublico();

    expect(prisma.parceiro.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
    expect(res).toHaveLength(1);
    expect(res[0].nome).toBe('Liga Magic');
  });

  it('registrarClique incrementa só quando ativo (updateMany condicional)', async () => {
    await service.registrarClique('p1');

    expect(prisma.parceiro.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', ativo: true },
      data: { cliques: { increment: 1 } },
    });
  });

  it('atualizar lança 404 quando o parceiro não existe', async () => {
    prisma.parceiro.findUnique.mockResolvedValue(null);

    await expect(service.atualizar('x', { nome: 'Novo' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.parceiro.update).not.toHaveBeenCalled();
  });

  it('criar persiste com defaults (ativo/ordem)', async () => {
    prisma.parceiro.create.mockResolvedValue(parceiro());

    await service.criar({ nome: 'Liga Magic', url: 'https://ligamagic.com.br' });

    expect(prisma.parceiro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ativo: true, ordem: 0 }),
      }),
    );
  });
});
