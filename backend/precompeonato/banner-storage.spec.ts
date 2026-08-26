import { BadRequestException } from '@nestjs/common';
import { BannerStorage } from './banner-storage';

describe('BannerStorage', () => {
  it('rejeita MIME inválido e arquivo > 2MB', async () => {
    const s = new BannerStorage();
    await expect(
      s.save('c1', { mimetype: 'application/pdf', buffer: Buffer.from('x'), size: 10 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      s.save('c1', { mimetype: 'image/png', buffer: Buffer.alloc(1), size: 2 * 1024 * 1024 + 1 }),
    ).rejects.toThrow(BadRequestException);
  });
});
