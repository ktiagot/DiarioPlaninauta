import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

const MAX_SIZE = 2 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALL_EXTS = ['.jpg', '.png', '.webp'];

@Injectable()
export class BannerStorage {
  private readonly dir = join(process.cwd(), 'uploads', 'campeonatos');

  async save(
    campeonatoId: string,
    file: { mimetype: string; buffer: Buffer; size: number },
  ): Promise<string> {
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato de imagem inválido. Use JPEG, PNG ou WebP.');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('O banner deve ter no máximo 2 MB.');
    }

    await fs.mkdir(this.dir, { recursive: true });

    for (const otherExt of ALL_EXTS) {
      if (otherExt !== ext) {
        try {
          await fs.unlink(join(this.dir, campeonatoId + otherExt));
        } catch {
          // arquivo anterior com outra extensão pode não existir
        }
      }
    }

    await fs.writeFile(join(this.dir, campeonatoId + ext), file.buffer);
    return `/uploads/campeonatos/${campeonatoId}${ext}`;
  }
}
