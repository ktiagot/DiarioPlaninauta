import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PreconsModule } from '../precons/precons.module';
import { MesasController } from './mesas.controller';
import { MesasService } from './mesas.service';

@Module({
  imports: [PrismaModule, PreconsModule],
  controllers: [MesasController],
  providers: [MesasService],
  exports: [MesasService],
})
export class MesasModule {}
