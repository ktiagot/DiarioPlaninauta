ALTER TABLE "campeonatos" ADD COLUMN "edicao" TEXT NOT NULL DEFAULT '#1';
ALTER TABLE "campeonatos" ADD COLUMN "dataInicio" DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE "campeonatos" ADD COLUMN "descricao" TEXT;
ALTER TABLE "campeonatos" ADD COLUMN "bannerUrl" TEXT;
