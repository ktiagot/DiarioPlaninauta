-- Enum de status do convite de mesa casual.
CREATE TYPE "ConviteStatus" AS ENUM ('PENDENTE', 'ACEITO', 'REJEITADO');

-- Tabela de convites para mesa casual.
CREATE TABLE "convites_mesa" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "deUserId" TEXT NOT NULL,
    "paraUserId" TEXT NOT NULL,
    "status" "ConviteStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "convites_mesa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "convites_mesa_mesaId_idx" ON "convites_mesa"("mesaId");
CREATE INDEX "convites_mesa_paraUserId_status_idx" ON "convites_mesa"("paraUserId", "status");

ALTER TABLE "convites_mesa"
    ADD CONSTRAINT "convites_mesa_mesaId_fkey" FOREIGN KEY ("mesaId")
    REFERENCES "mesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "convites_mesa"
    ADD CONSTRAINT "convites_mesa_deUserId_fkey" FOREIGN KEY ("deUserId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "convites_mesa"
    ADD CONSTRAINT "convites_mesa_paraUserId_fkey" FOREIGN KEY ("paraUserId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Referência opcional em notificações (ex.: convite_mesa -> id do convite).
ALTER TABLE "notificacoes" ADD COLUMN "referenciaTipo" TEXT;
ALTER TABLE "notificacoes" ADD COLUMN "referenciaId" TEXT;
