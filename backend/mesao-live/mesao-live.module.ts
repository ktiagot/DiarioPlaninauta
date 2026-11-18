import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MesaoLiveController } from './mesao-live.controller';
import { MesaoLiveService } from './mesao-live.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MesaoLiveController],
  providers: [MesaoLiveService],
})
export class MesaoLiveModule {}
