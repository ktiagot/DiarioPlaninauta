import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './common/env.validation';
import { AuthModule } from './auth/auth.module';
import { ComunidadeModule } from './comunidade/comunidade.module';
import { HealthModule } from './health/health.module';
import { LojaModule } from './loja/loja.module';
import { MesasModule } from './mesas/mesas.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { ParceirosModule } from './parceiros/parceiros.module';
import { PreconsModule } from './precons/precons.module';
import { PrecompeonatoModule } from './precompeonato/precompeonato.module';
import { SugestoesModule } from './sugestoes/sugestoes.module';
import { TemaModule } from './tema/tema.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    // Rate limiting global: 120 requisições por minuto por IP (padrão).
    // Rotas sensíveis (login/cadastro) aplicam limites próprios mais baixos.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    UsersModule,
    MesasModule,
    PrecompeonatoModule,
    ComunidadeModule,
    SugestoesModule,
    LojaModule,
    NotificacoesModule,
    ParceirosModule,
    PreconsModule,
    TemaModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
