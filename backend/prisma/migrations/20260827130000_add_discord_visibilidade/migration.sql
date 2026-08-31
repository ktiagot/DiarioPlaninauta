-- Enum de visibilidade de dados sensíveis do perfil.
CREATE TYPE "Visibilidade" AS ENUM ('PUBLICO', 'FAVORITOS', 'PRIVADO');

-- Discord no perfil (liberado no contato mútuo).
ALTER TABLE "users" ADD COLUMN "discord" TEXT;

-- Visibilidade por campo.
ALTER TABLE "users" ADD COLUMN "visibilidadeNome" "Visibilidade" NOT NULL DEFAULT 'PUBLICO';
ALTER TABLE "users" ADD COLUMN "visibilidadeTelefone" "Visibilidade" NOT NULL DEFAULT 'FAVORITOS';
