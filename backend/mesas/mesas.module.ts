import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PreconsModule } from '../precons/precons.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { PrecompeonatoModule } from '../precompeonato/precompeonato.module';
import { MesasController } from './mesas.controller';
import { MesasService } from './mesas.service';
import { MesasCleanupService } from './mesas-cleanup.service';
import { MesasSchedulerService } from './mesas-scheduler.service';

@Module({
  imports: [PrismaModule, PreconsModule, NotificacoesModule, PrecompeonatoModule],
  controllers: [MesasController],
  providers: [MesasService, MesasCleanupService, MesasSchedulerService],
  exports: [MesasService],
})
export class MesasModule {}
