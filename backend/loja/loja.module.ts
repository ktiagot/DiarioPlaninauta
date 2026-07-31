import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LojaController } from './loja.controller';
import { LojaService } from './loja.service';

@Module({
  imports: [PrismaModule],
  controllers: [LojaController],
  providers: [LojaService],
  exports: [LojaService],
})
export class LojaModule {}
