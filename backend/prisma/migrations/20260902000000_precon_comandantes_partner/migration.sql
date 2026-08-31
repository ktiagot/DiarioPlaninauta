-- AlterTable: Precon
ALTER TABLE "precons" ADD COLUMN "isPartnerDeck" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: PreconComandante
ALTER TABLE "precon_comandantes" ADD COLUMN "colorIdentity" TEXT NOT NULL DEFAULT '';
ALTER TABLE "precon_comandantes" ADD COLUMN "isPartner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "precon_comandantes" ADD COLUMN "isPrincipal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Inscricao (segundo comandante opcional para partners)
ALTER TABLE "inscricoes" ADD COLUMN "preconComandante2Id" TEXT;

-- CreateIndex
CREATE INDEX "inscricoes_preconComandante2Id_idx" ON "inscricoes"("preconComandante2Id");

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_preconComandante2Id_fkey" FOREIGN KEY ("preconComandante2Id") REFERENCES "precon_comandantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
