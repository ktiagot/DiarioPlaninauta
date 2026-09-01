import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesSchedulerService } from './notificacoes-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesSchedulerService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
