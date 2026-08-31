import { Module } from '@nestjs/common';
import { ApoiaSeModule } from '../apoiase/apoiase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { ComunidadeController } from './comunidade.controller';
import { ComunidadeService } from './comunidade.service';
import { ComunidadeSchedulerService } from './comunidade-scheduler.service';

@Module({
  imports: [PrismaModule, ApoiaSeModule, NotificacoesModule],
  controllers: [ComunidadeController],
  providers: [ComunidadeService, ComunidadeSchedulerService],
})
export class ComunidadeModule {}
