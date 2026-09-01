import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TemaController } from './tema.controller';
import { TemaService } from './tema.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TemaController],
  providers: [TemaService],
})
export class TemaModule {}
