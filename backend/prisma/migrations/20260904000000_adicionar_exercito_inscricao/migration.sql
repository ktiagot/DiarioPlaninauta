-- CreateEnum
CREATE TYPE "Exercito" AS ENUM ('ANAOS', 'HUMANOS', 'ELFOS', 'WARGS', 'ORCS');

-- AlterTable
ALTER TABLE "inscricoes" ADD COLUMN "exercito" "Exercito";
