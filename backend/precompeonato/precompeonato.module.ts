import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PreconsModule } from '../precons/precons.module';
import { BannerStorage } from './banner-storage';
import { CampeonatoAdminService } from './campeonato-admin.service';
import { PrecompeonatoController } from './precompeonato.controller';
import { PrecompeonatoService } from './precompeonato.service';
import { SorteioService } from './sorteio/sorteio.service';
import { GruposController } from './grupos.controller';
import { GruposService } from './grupos.service';
import { GestaoController } from './gestao.controller';
import { GestaoService } from './gestao.service';

@Module({
  imports: [PrismaModule, AuthModule, PreconsModule],
  controllers: [PrecompeonatoController, GruposController, GestaoController],
  providers: [
    PrecompeonatoService,
    SorteioService,
    CampeonatoAdminService,
    GruposService,
    GestaoService,
    BannerStorage,
  ],
  exports: [SorteioService],
})
export class PrecompeonatoModule {}
