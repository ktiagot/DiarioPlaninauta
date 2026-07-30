import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PrecompeonatoController } from './precompeonato.controller';
import { PrecompeonatoService } from './precompeonato.service';
import { SorteioService } from './sorteio/sorteio.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PrecompeonatoController],
  providers: [PrecompeonatoService, SorteioService],
})
export class PrecompeonatoModule {}
