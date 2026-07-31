-- CreateTable
CREATE TABLE "favoritos" (
    "id" TEXT NOT NULL,
    "deUserId" TEXT NOT NULL,
    "paraUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_deUserId_paraUserId_key" ON "favoritos"("deUserId", "paraUserId");

-- CreateIndex
CREATE INDEX "favoritos_deUserId_idx" ON "favoritos"("deUserId");

-- CreateIndex
CREATE INDEX "favoritos_paraUserId_idx" ON "favoritos"("paraUserId");

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_deUserId_fkey" FOREIGN KEY ("deUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_paraUserId_fkey" FOREIGN KEY ("paraUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
