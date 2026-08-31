// @nestjs/schedule é ESM; mockamos o decorator @Cron como no-op para o Jest.
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
}));

import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MesasService } from './mesas.service';
import { MesasCleanupService } from './mesas-cleanup.service';

describe('MesasCleanupService', () => {
  let cleanup: MesasCleanupService;
  let mesasService: { limparMesasExpiradas: jest.Mock };

  beforeEach(async () => {
    mesasService = { limparMesasExpiradas: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MesasCleanupService,
        { provide: MesasService, useValue: mesasService },
      ],
    }).compile();

    cleanup = module.get(MesasCleanupService);
  });

  it('handleLimpeza chama limparMesasExpiradas', async () => {
    mesasService.limparMesasExpiradas.mockResolvedValue(2);

    await cleanup.handleLimpeza();

    expect(mesasService.limparMesasExpiradas).toHaveBeenCalledTimes(1);
  });

  it('não propaga erro se a limpeza falhar', async () => {
    mesasService.limparMesasExpiradas.mockRejectedValue(new Error('db down'));
    // silencia o Logger.error esperado
    jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(cleanup.handleLimpeza()).resolves.toBeUndefined();
  });
});
