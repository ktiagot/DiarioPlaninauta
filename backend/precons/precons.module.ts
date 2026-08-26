import { Module } from '@nestjs/common';
import { PreconsController } from './precons.controller';
import { PreconsService } from './precons.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreconsController],
  providers: [PreconsService],
  exports: [PreconsService],
})
export class PreconsModule {}
