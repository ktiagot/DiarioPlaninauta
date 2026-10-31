import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PreconsModule } from '../precons/precons.module';
import { BannerStorage } from './banner-storage';
import { CampeonatoAdminService } from './campeonato-admin.service';
import { PrecompeonatoController } from './precompeonato.controller';
import { PrecompeonatoService } from './precompeonato.service';
import { SorteioService } from './sorteio/sorteio.service';

@Module({
  imports: [PrismaModule, AuthModule, PreconsModule],
  controllers: [PrecompeonatoController],
  providers: [PrecompeonatoService, SorteioService, CampeonatoAdminService, BannerStorage],
  exports: [SorteioService],
})
export class PrecompeonatoModule {}
