-- CreateTable
CREATE TABLE "mesas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "linkPartida" TEXT,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesa_jogadores" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "posicaoFinal" INTEGER,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesa_jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eliminacoes" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "eliminadorUserId" TEXT NOT NULL,
    "eliminadoUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eliminacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mesa_jogadores_mesaId_idx" ON "mesa_jogadores"("mesaId");

-- CreateIndex
CREATE INDEX "mesa_jogadores_userId_idx" ON "mesa_jogadores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mesa_jogadores_mesaId_userId_key" ON "mesa_jogadores"("mesaId", "userId");

-- CreateIndex
CREATE INDEX "eliminacoes_mesaId_idx" ON "eliminacoes"("mesaId");

-- CreateIndex
CREATE UNIQUE INDEX "eliminacoes_mesaId_eliminadoUserId_key" ON "eliminacoes"("mesaId", "eliminadoUserId");

-- AddForeignKey
ALTER TABLE "mesa_jogadores" ADD CONSTRAINT "mesa_jogadores_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_jogadores" ADD CONSTRAINT "mesa_jogadores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eliminacoes" ADD CONSTRAINT "eliminacoes_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eliminacoes" ADD CONSTRAINT "eliminacoes_eliminadorUserId_fkey" FOREIGN KEY ("eliminadorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eliminacoes" ADD CONSTRAINT "eliminacoes_eliminadoUserId_fkey" FOREIGN KEY ("eliminadoUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
