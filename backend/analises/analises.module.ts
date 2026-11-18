import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnalisesController } from './analises.controller';
import { AnalisesService } from './analises.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AnalisesController],
  providers: [AnalisesService],
})
export class AnalisesModule {}
