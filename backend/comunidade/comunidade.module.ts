import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ComunidadeController } from './comunidade.controller';
import { ComunidadeService } from './comunidade.service';

@Module({
  imports: [PrismaModule],
  controllers: [ComunidadeController],
  providers: [ComunidadeService],
})
export class ComunidadeModule {}
