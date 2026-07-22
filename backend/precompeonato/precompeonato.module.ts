import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrecompeonatoController } from './precompeonato.controller';
import { PrecompeonatoService } from './precompeonato.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrecompeonatoController],
  providers: [PrecompeonatoService],
})
export class PrecompeonatoModule {}
