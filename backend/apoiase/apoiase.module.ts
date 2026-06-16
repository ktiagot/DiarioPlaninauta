import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ApoiaSeService } from './apoiase.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ApoiaSeService],
  exports: [ApoiaSeService],
})
export class ApoiaSeModule {}
