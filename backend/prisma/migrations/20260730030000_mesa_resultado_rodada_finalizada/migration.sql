-- AlterTable
ALTER TABLE "rodadas" ADD COLUMN "finalizada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mesas_torneio" ADD COLUMN "linkPartida" TEXT;
ALTER TABLE "mesas_torneio" ADD COLUMN "empate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mesas_torneio" ADD COLUMN "empatadosInscricaoIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
