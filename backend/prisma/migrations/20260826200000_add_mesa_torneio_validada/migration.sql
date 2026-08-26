-- AlterTable: validação admin do resultado da mesa
ALTER TABLE "mesas_torneio" ADD COLUMN "validada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mesas_torneio" ADD COLUMN "validadaEm" TIMESTAMP(3);

-- Rodadas já fechadas: mesas entram como validadas
UPDATE "mesas_torneio" m
SET "validada" = true, "validadaEm" = m."updatedAt"
FROM "rodadas" r
WHERE m."rodadaId" = r.id AND r.finalizada = true;
