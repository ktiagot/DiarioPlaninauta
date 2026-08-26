import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampeonatoAdminService } from './campeonato-admin.service';

function camp(over: Partial<{ id: string; status: CampeonatoStatus }> = {}) {
  return {
    id: over.id ?? 'c1',
    nome: 'Precompeonato #1',
    edicao: '#1',
    dataInicio: new Date('2026-09-01T00:00:00.000Z'),
    descricao: null,
    bannerUrl: null,
    status: over.status ?? CampeonatoStatus.INSCRICOES_ABERTAS,
    inscricoesAbertasAte: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date(),
  };
}

describe('CampeonatoAdminService create/list', () => {
  let service: CampeonatoAdminService;
  let prisma: {
    campeonato: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      campeonato: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        CampeonatoAdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CampeonatoAdminService);
  });

  it('create persiste edicao/dataInicio e nasce INSCRICOES_ABERTAS', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(null);
    prisma.campeonato.create.mockResolvedValue(camp());

    const result = await service.create({
      nome: 'Precompeonato #1',
      edicao: '#1',
      dataInicio: '2026-09-01',
    });

    expect(prisma.campeonato.create).toHaveBeenCalledWith({
      data: {
        nome: 'Precompeonato #1',
        edicao: '#1',
        dataInicio: new Date('2026-09-01T00:00:00.000Z'),
        descricao: null,
        status: CampeonatoStatus.INSCRICOES_ABERTAS,
      },
    });
    expect(result.statusCode).toBe(CampeonatoStatus.INSCRICOES_ABERTAS);
    expect(result.dataInicio).toBe('2026-09-01');
  });

  it('create 409 se já existe INSCRICOES_ABERTAS', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(camp({ status: CampeonatoStatus.INSCRICOES_ABERTAS }));
    await expect(
      service.create({ nome: 'X', edicao: '#2', dataInicio: '2026-10-01' }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.campeonato.create).not.toHaveBeenCalled();
  });

  it('create 409 se já existe EM_ANDAMENTO', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(camp({ status: CampeonatoStatus.EM_ANDAMENTO }));
    await expect(
      service.create({ nome: 'X', edicao: '#2', dataInicio: '2026-10-01' }),
    ).rejects.toThrow(ConflictException);
  });

  it('create ok quando o único existente está ENCERRADO', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(null);
    prisma.campeonato.create.mockResolvedValue(camp({ id: 'c2' }));
    await expect(
      service.create({ nome: 'X', edicao: '#2', dataInicio: '2026-10-01' }),
    ).resolves.toMatchObject({ id: 'c2' });
  });

  it('list devolve createdAt desc', async () => {
    prisma.campeonato.findMany.mockResolvedValue([camp({ id: 'c2' }), camp({ id: 'c1' })]);
    const list = await service.list();
    expect(prisma.campeonato.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
    expect(list.map((c) => c.id)).toEqual(['c2', 'c1']);
  });
});
