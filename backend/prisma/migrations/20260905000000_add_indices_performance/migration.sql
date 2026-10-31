-- Índices de performance para filtros/ordenações quentes.

-- users: filtro por apoiador ativo (comunidade, métricas, dashboard)
CREATE INDEX "users_isApoiadorAtivo_idx" ON "users"("isApoiadorAtivo");

-- campeonatos: findFirst({ where: status, orderBy createdAt desc }) em quase todo fluxo
CREATE INDEX "campeonatos_status_createdAt_idx" ON "campeonatos"("status", "createdAt");

-- inscricoes: filtro mais comum é (campeonatoId, ativo). Substitui o índice só de campeonatoId.
DROP INDEX IF EXISTS "inscricoes_campeonatoId_idx";
CREATE INDEX "inscricoes_campeonatoId_ativo_idx" ON "inscricoes"("campeonatoId", "ativo");

-- mesas: notificarMesasDeHoje / limpeza usam (finalizada, dataHora)
CREATE INDEX "mesas_finalizada_dataHora_idx" ON "mesas"("finalizada", "dataHora");

-- pontos: histórico por usuário ordenado por data + groupBy por usuário. Substitui o índice só de userId.
DROP INDEX IF EXISTS "pontos_userId_idx";
CREATE INDEX "pontos_userId_createdAt_idx" ON "pontos"("userId", "createdAt");

-- notificacoes: limparAntigas filtra por createdAt global
CREATE INDEX "notificacoes_createdAt_idx" ON "notificacoes"("createdAt");
