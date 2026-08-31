import { Module } from '@nestjs/common';
import { ApoiaSeModule } from '../apoiase/apoiase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { ComunidadeController } from './comunidade.controller';
import { ComunidadeService } from './comunidade.service';

@Module({
  imports: [PrismaModule, ApoiaSeModule, NotificacoesModule],
  controllers: [ComunidadeController],
  providers: [ComunidadeService],
})
export class ComunidadeModule {}
