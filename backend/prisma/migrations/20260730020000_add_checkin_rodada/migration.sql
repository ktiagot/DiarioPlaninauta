-- CreateTable
CREATE TABLE "checkins_rodada" (
    "id" TEXT NOT NULL,
    "rodadaId" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_rodada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkins_rodada_rodadaId_idx" ON "checkins_rodada"("rodadaId");

-- CreateIndex
CREATE INDEX "checkins_rodada_inscricaoId_idx" ON "checkins_rodada"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "checkins_rodada_rodadaId_inscricaoId_key" ON "checkins_rodada"("rodadaId", "inscricaoId");

-- AddForeignKey
ALTER TABLE "checkins_rodada" ADD CONSTRAINT "checkins_rodada_rodadaId_fkey" FOREIGN KEY ("rodadaId") REFERENCES "rodadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins_rodada" ADD CONSTRAINT "checkins_rodada_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
