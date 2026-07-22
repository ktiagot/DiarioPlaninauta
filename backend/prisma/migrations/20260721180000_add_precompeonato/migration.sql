-- CreateEnum
CREATE TYPE "CampeonatoStatus" AS ENUM ('INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'ENCERRADO');

-- CreateTable
CREATE TABLE "campeonatos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "CampeonatoStatus" NOT NULL DEFAULT 'INSCRICOES_ABERTAS',
    "inscricoesAbertasAte" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campeonatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" TEXT NOT NULL,
    "campeonatoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deckUrl" TEXT NOT NULL,
    "deckNome" TEXT NOT NULL,
    "comandante" TEXT NOT NULL,
    "aceiteTermos" BOOLEAN NOT NULL,
    "aceiteTermosEm" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "posicao" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rodadas" (
    "id" TEXT NOT NULL,
    "campeonatoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rodadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas_torneio" (
    "id" TEXT NOT NULL,
    "rodadaId" TEXT NOT NULL,
    "numeroMesa" INTEGER NOT NULL,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_torneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesa_torneio_jogadores" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "posicaoFinal" INTEGER,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesa_torneio_jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inscricoes_campeonatoId_idx" ON "inscricoes"("campeonatoId");

-- CreateIndex
CREATE INDEX "inscricoes_userId_idx" ON "inscricoes"("userId");

-- CreateIndex
CREATE INDEX "inscricoes_email_idx" ON "inscricoes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_campeonatoId_userId_key" ON "inscricoes"("campeonatoId", "userId");

-- CreateIndex
CREATE INDEX "rodadas_campeonatoId_idx" ON "rodadas"("campeonatoId");

-- CreateIndex
CREATE UNIQUE INDEX "rodadas_campeonatoId_numero_key" ON "rodadas"("campeonatoId", "numero");

-- CreateIndex
CREATE INDEX "mesas_torneio_rodadaId_idx" ON "mesas_torneio"("rodadaId");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_torneio_rodadaId_numeroMesa_key" ON "mesas_torneio"("rodadaId", "numeroMesa");

-- CreateIndex
CREATE INDEX "mesa_torneio_jogadores_mesaId_idx" ON "mesa_torneio_jogadores"("mesaId");

-- CreateIndex
CREATE INDEX "mesa_torneio_jogadores_inscricaoId_idx" ON "mesa_torneio_jogadores"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "mesa_torneio_jogadores_mesaId_inscricaoId_key" ON "mesa_torneio_jogadores"("mesaId", "inscricaoId");

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rodadas" ADD CONSTRAINT "rodadas_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas_torneio" ADD CONSTRAINT "mesas_torneio_rodadaId_fkey" FOREIGN KEY ("rodadaId") REFERENCES "rodadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_torneio_jogadores" ADD CONSTRAINT "mesa_torneio_jogadores_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas_torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_torneio_jogadores" ADD CONSTRAINT "mesa_torneio_jogadores_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
