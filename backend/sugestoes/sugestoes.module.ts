import { Module } from '@nestjs/common';
import { SugestoesController } from './sugestoes.controller';
import { SugestoesService } from './sugestoes.service';

@Module({
  controllers: [SugestoesController],
  providers: [SugestoesService],
})
export class SugestoesModule {}
