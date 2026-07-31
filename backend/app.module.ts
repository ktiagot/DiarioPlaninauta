import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ComunidadeModule } from './comunidade/comunidade.module';
import { LojaModule } from './loja/loja.module';
import { MesasModule } from './mesas/mesas.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { PrecompeonatoModule } from './precompeonato/precompeonato.module';
import { SugestoesModule } from './sugestoes/sugestoes.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    MesasModule,
    PrecompeonatoModule,
    ComunidadeModule,
    SugestoesModule,
    LojaModule,
    NotificacoesModule,
  ],
})
export class AppModule {}
