-- AlterTable: data da rodada (backfill a partir de createdAt)
ALTER TABLE "rodadas" ADD COLUMN "dataRodada" DATE;

UPDATE "rodadas" SET "dataRodada" = "createdAt"::date WHERE "dataRodada" IS NULL;

ALTER TABLE "rodadas" ALTER COLUMN "dataRodada" SET NOT NULL;
