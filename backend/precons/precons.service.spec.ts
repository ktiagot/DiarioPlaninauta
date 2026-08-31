import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PreconsService } from './precons.service';

describe('PreconsService', () => {
  let service: PreconsService;
  let prisma: {
    precon: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    preconComandante: {
      delete: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    inscricao: { count: jest.Mock };
    mesaJogador: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      precon: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      preconComandante: {
        delete: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      inscricao: { count: jest.fn() },
      mesaJogador: { count: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [PreconsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PreconsService);
  });

  it('search exclui banidos', async () => {
    prisma.precon.findMany.mockResolvedValue([
      {
        id: '1',
        nome: 'Counter Intelligence',
        setNome: 'Tarkir',
        ano: 2025,
      },
    ]);

    const result = await service.search('counter');

    expect(prisma.precon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ banido: false }),
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('remove rejeita precon com referências', async () => {
    prisma.precon.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.inscricao.count.mockResolvedValue(1);
    prisma.mesaJogador.count.mockResolvedValue(0);

    await expect(service.remove('p1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('listComandantes retorna 404 para precon banido', async () => {
    prisma.precon.findUnique.mockResolvedValue({
      id: 'p1',
      banido: true,
      comandantes: [],
    });

    await expect(service.listComandantes('p1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
