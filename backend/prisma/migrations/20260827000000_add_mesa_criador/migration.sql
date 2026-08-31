-- AlterTable
ALTER TABLE "mesas" ADD COLUMN "criadorUserId" TEXT;

-- AlterTable
ALTER TABLE "mesas" ADD COLUMN "descricao" TEXT;

-- CreateIndex
CREATE INDEX "mesas_criadorUserId_idx" ON "mesas"("criadorUserId");

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_criadorUserId_fkey" FOREIGN KEY ("criadorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
