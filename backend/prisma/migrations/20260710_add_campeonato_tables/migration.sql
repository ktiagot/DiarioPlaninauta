-- Tabelas do sistema de campeonato (Precompeonato)
-- Complementa o schema User existente com toda a estrutura de torneios

-- ============================================================
-- PRECONS (catálogo de decks)
-- ============================================================
CREATE TABLE "Precon" (
    "id" SERIAL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "setNome" TEXT NOT NULL,
    "comandantePrincipal" TEXT NOT NULL,
    "comandanteSecundario" TEXT,
    "cores" TEXT,
    "ano" INTEGER,
    "banido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PreconComandante" (
    "id" SERIAL PRIMARY KEY,
    "preconId" INTEGER NOT NULL REFERENCES "Precon"("id") ON DELETE CASCADE,
    "comandante" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "temPartner" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX "idx_precon_comandante_precon" ON "PreconComandante"("preconId");

-- ============================================================
-- CAMPEONATOS
-- ============================================================
CREATE TABLE "Campeonato" (
    "id" SERIAL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "edicao" TEXT,
    "dataInicio" DATE,
    "dataFimInscricoes" TIMESTAMP(3),
    "dataFim" DATE,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inscricoes', -- inscricoes, em_andamento, finalizado
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INSCRIÇÕES
-- ============================================================
CREATE TABLE "Inscricao" (
    "id" SERIAL PRIMARY KEY,
    "campeonatoId" INTEGER NOT NULL REFERENCES "Campeonato"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "nome" TEXT NOT NULL,
    "discord" TEXT,
    "whatsapp" TEXT,
    "preconId" INTEGER REFERENCES "Precon"("id"),
    "comandante1" TEXT,
    "comandante2" TEXT,
    "deckNome" TEXT,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "pontosCumulativos" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "segundosLugares" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_inscricao_user_campeonato" ON "Inscricao"("userId", "campeonatoId");
CREATE INDEX "idx_inscricao_campeonato" ON "Inscricao"("campeonatoId");

-- ============================================================
-- RODADAS
-- ============================================================
CREATE TABLE "Rodada" (
    "id" SERIAL PRIMARY KEY,
    "campeonatoId" INTEGER NOT NULL REFERENCES "Campeonato"("id") ON DELETE CASCADE,
    "numero" INTEGER NOT NULL,
    "dataRodada" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_rodada_campeonato" ON "Rodada"("campeonatoId");

-- ============================================================
-- MESAS (de campeonato)
-- ============================================================
CREATE TABLE "Mesa" (
    "id" SERIAL PRIMARY KEY,
    "rodadaId" INTEGER NOT NULL REFERENCES "Rodada"("id") ON DELETE CASCADE,
    "numeroMesa" INTEGER NOT NULL,
    "vencedorId" INTEGER REFERENCES "Inscricao"("id"),
    "segundoId" INTEGER REFERENCES "Inscricao"("id"),
    "empate" BOOLEAN DEFAULT false,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_mesa_rodada" ON "Mesa"("rodadaId");

-- ============================================================
-- JOGADORES POR MESA
-- ============================================================
CREATE TABLE "MesaJogador" (
    "id" SERIAL PRIMARY KEY,
    "mesaId" INTEGER NOT NULL REFERENCES "Mesa"("id") ON DELETE CASCADE,
    "inscricaoId" INTEGER NOT NULL REFERENCES "Inscricao"("id") ON DELETE CASCADE,
    "posicao" INTEGER,
    "posicaoFinal" INTEGER
);

CREATE INDEX "idx_mesa_jogador_mesa" ON "MesaJogador"("mesaId");

-- ============================================================
-- HISTÓRICO DE PARTIDAS (para estatísticas)
-- ============================================================
CREATE TABLE "HistoricoPartida" (
    "id" SERIAL PRIMARY KEY,
    "mesaId" INTEGER REFERENCES "Mesa"("id") ON DELETE CASCADE,
    "campeonatoId" INTEGER REFERENCES "Campeonato"("id"),
    "jogadorId" INTEGER REFERENCES "Inscricao"("id"),
    "preconId" INTEGER REFERENCES "Precon"("id"),
    "posicaoFinal" INTEGER NOT NULL,
    "pontosGanhos" INTEGER NOT NULL DEFAULT 0,
    "empate" BOOLEAN NOT NULL DEFAULT false,
    "oponente1Id" INTEGER REFERENCES "Inscricao"("id"),
    "oponente1PreconId" INTEGER REFERENCES "Precon"("id"),
    "oponente2Id" INTEGER REFERENCES "Inscricao"("id"),
    "oponente2PreconId" INTEGER REFERENCES "Precon"("id"),
    "oponente3Id" INTEGER REFERENCES "Inscricao"("id"),
    "oponente3PreconId" INTEGER REFERENCES "Precon"("id"),
    "dataPartida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_historico_jogador" ON "HistoricoPartida"("jogadorId", "campeonatoId");

-- ============================================================
-- HISTÓRICO DE OPONENTES (para pareamento suíço)
-- ============================================================
CREATE TABLE "HistoricoOponente" (
    "id" SERIAL PRIMARY KEY,
    "campeonatoId" INTEGER NOT NULL REFERENCES "Campeonato"("id") ON DELETE CASCADE,
    "jogador1Id" INTEGER NOT NULL REFERENCES "Inscricao"("id") ON DELETE CASCADE,
    "jogador2Id" INTEGER NOT NULL REFERENCES "Inscricao"("id") ON DELETE CASCADE,
    "vezesEnfrentados" INTEGER NOT NULL DEFAULT 1,
    "ultimaRodada" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_oponentes_unique" ON "HistoricoOponente"("campeonatoId", "jogador1Id", "jogador2Id");

-- ============================================================
-- MESAS CASUAIS (Mesões)
-- ============================================================
CREATE TABLE "MesaCasual" (
    "id" SERIAL PRIMARY KEY,
    "criadorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "linkJogo" TEXT,
    "maxJogadores" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'aberta', -- aberta, cheia, em_andamento, finalizada, cancelada
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_mesa_casual_criador" ON "MesaCasual"("criadorId");
CREATE INDEX "idx_mesa_casual_status" ON "MesaCasual"("status");

CREATE TABLE "MesaCasualJogador" (
    "id" SERIAL PRIMARY KEY,
    "mesaCasualId" INTEGER NOT NULL REFERENCES "MesaCasual"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "preconId" INTEGER REFERENCES "Precon"("id"),
    "comandante1" TEXT,
    "comandante2" TEXT,
    "deckLink" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_mesa_casual_jogador_unique" ON "MesaCasualJogador"("mesaCasualId", "userId");

-- ============================================================
-- FAVORITOS (comunidade)
-- ============================================================
CREATE TABLE "Favorito" (
    "id" SERIAL PRIMARY KEY,
    "deUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "paraUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_favorito_unique" ON "Favorito"("deUserId", "paraUserId");
CREATE INDEX "idx_favorito_de" ON "Favorito"("deUserId");
CREATE INDEX "idx_favorito_para" ON "Favorito"("paraUserId");

-- ============================================================
-- PONTOS (sistema de recompensas — futuro)
-- ============================================================
CREATE TABLE "Ponto" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "tipo" TEXT NOT NULL, -- credito, debito
    "quantidade" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "referenciaTipo" TEXT, -- campeonato, mesa_casual, loja, manual
    "referenciaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_ponto_user" ON "Ponto"("userId");

-- ============================================================
-- LOJA (futuro)
-- ============================================================
CREATE TABLE "LojaProduto" (
    "id" SERIAL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "precoPontos" INTEGER NOT NULL,
    "imagemUrl" TEXT,
    "estoque" INTEGER, -- NULL = ilimitado
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LojaResgate" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "produtoId" INTEGER NOT NULL REFERENCES "LojaProduto"("id"),
    "pontosGastos" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, entregue, cancelado
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_resgate_user" ON "LojaResgate"("userId");

-- ============================================================
-- AUTH (códigos de verificação + sessões)
-- ============================================================
CREATE TABLE "CodigoVerificacao" (
    "id" SERIAL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Sessao" (
    "id" SERIAL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_sessao_token" ON "Sessao"("token");
