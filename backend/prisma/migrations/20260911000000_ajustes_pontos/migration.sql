-- CreateTable
CREATE TABLE "ajustes_pontos" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajustes_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ajustes_pontos_inscricaoId_idx" ON "ajustes_pontos"("inscricaoId");

-- AddForeignKey
ALTER TABLE "ajustes_pontos" ADD CONSTRAINT "ajustes_pontos_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
