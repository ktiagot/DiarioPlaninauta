-- Enum de modo de tema.
CREATE TYPE "TemaModo" AS ENUM ('PADRAO', 'PERSONALIZADO');

-- Configuração global de tema (registro único).
CREATE TABLE "configuracao_tema" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "modo" "TemaModo" NOT NULL DEFAULT 'PADRAO',
    "primary" TEXT NOT NULL DEFAULT '#f58220',
    "primaryStrong" TEXT NOT NULL DEFAULT '#ff6b00',
    "onPrimary" TEXT NOT NULL DEFAULT '#ffffff',
    "bg" TEXT NOT NULL DEFAULT '#000000',
    "text" TEXT NOT NULL DEFAULT '#ffffff',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "configuracao_tema_pkey" PRIMARY KEY ("id")
);

-- Registro inicial (tema padrão).
INSERT INTO "configuracao_tema" ("id", "modo", "updatedAt")
VALUES ('singleton', 'PADRAO', CURRENT_TIMESTAMP);
