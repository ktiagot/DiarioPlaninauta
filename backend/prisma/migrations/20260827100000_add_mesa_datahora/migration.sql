-- AlterTable: dataHora obrigatório (default temporário para linhas existentes)
ALTER TABLE "mesas" ADD COLUMN "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "mesas" ALTER COLUMN "dataHora" DROP DEFAULT;

-- AlterTable: timestamp de finalização
ALTER TABLE "mesas" ADD COLUMN "finalizadaEm" TIMESTAMP(3);
