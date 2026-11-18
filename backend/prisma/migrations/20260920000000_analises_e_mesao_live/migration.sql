-- CreateEnum
CREATE TYPE "MesaoTipo" AS ENUM ('JOGADOR', 'SUPLENTE');

-- CreateTable
CREATE TABLE "analise_sessoes" (
    "id" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT,
    "vagas" INTEGER NOT NULL,
    "aberta" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analise_sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analise_inscricoes" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commander" TEXT NOT NULL,
    "linkDeck" TEXT NOT NULL,
    "bracket" TEXT,
    "budget" TEXT NOT NULL,
    "objetivos" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analise_inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesao_sessoes" (
    "id" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT,
    "bracket" TEXT,
    "vagasJogador" INTEGER NOT NULL DEFAULT 3,
    "vagasSuplente" INTEGER NOT NULL DEFAULT 3,
    "aberta" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesao_sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesao_inscricoes" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "MesaoTipo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mesao_inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analise_sessoes_dataHora_idx" ON "analise_sessoes"("dataHora");

-- CreateIndex
CREATE UNIQUE INDEX "analise_inscricoes_sessaoId_userId_key" ON "analise_inscricoes"("sessaoId", "userId");

-- CreateIndex
CREATE INDEX "analise_inscricoes_sessaoId_createdAt_idx" ON "analise_inscricoes"("sessaoId", "createdAt");

-- CreateIndex
CREATE INDEX "analise_inscricoes_userId_idx" ON "analise_inscricoes"("userId");

-- CreateIndex
CREATE INDEX "mesao_sessoes_dataHora_idx" ON "mesao_sessoes"("dataHora");

-- CreateIndex
CREATE UNIQUE INDEX "mesao_inscricoes_sessaoId_userId_key" ON "mesao_inscricoes"("sessaoId", "userId");

-- CreateIndex
CREATE INDEX "mesao_inscricoes_sessaoId_tipo_createdAt_idx" ON "mesao_inscricoes"("sessaoId", "tipo", "createdAt");

-- CreateIndex
CREATE INDEX "mesao_inscricoes_userId_idx" ON "mesao_inscricoes"("userId");

-- AddForeignKey
ALTER TABLE "analise_inscricoes" ADD CONSTRAINT "analise_inscricoes_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "analise_sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_inscricoes" ADD CONSTRAINT "analise_inscricoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesao_inscricoes" ADD CONSTRAINT "mesao_inscricoes_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "mesao_sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesao_inscricoes" ADD CONSTRAINT "mesao_inscricoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
