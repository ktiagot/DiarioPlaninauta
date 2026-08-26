import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { BannerStorage } from './banner-storage';
import { CampeonatoAdminService } from './campeonato-admin.service';
import { PrecompeonatoController } from './precompeonato.controller';
import { PrecompeonatoService } from './precompeonato.service';
import { SorteioService } from './sorteio/sorteio.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificacoesModule],
  controllers: [PrecompeonatoController],
  providers: [PrecompeonatoService, SorteioService, CampeonatoAdminService, BannerStorage],
})
export class PrecompeonatoModule {}
