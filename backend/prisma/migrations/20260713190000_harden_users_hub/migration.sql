-- Remove incomplete/partial users created before cadastro-only creation.
-- Cadastro completo is now the only way to create User rows.
DELETE FROM "User"
WHERE "nome" IS NULL
   OR "sobrenome" IS NULL
   OR "nick" IS NULL
   OR "telefone" IS NULL
   OR "cidade" IS NULL
   OR "passwordHash" IS NULL;

-- Deduplicate nick before unique constraint (keep oldest by createdAt).
DELETE FROM "User" a
USING "User" b
WHERE a."nick" IS NOT NULL
  AND a."nick" = b."nick"
  AND a."createdAt" > b."createdAt";

UPDATE "User" SET "formatos" = ARRAY[]::TEXT[] WHERE "formatos" IS NULL;
UPDATE "User" SET "diasDisponiveis" = ARRAY[]::TEXT[] WHERE "diasDisponiveis" IS NULL;
UPDATE "User" SET "horarios" = ARRAY[]::TEXT[] WHERE "horarios" IS NULL;
UPDATE "User" SET "melhoresResultados" = ARRAY[]::INTEGER[] WHERE "melhoresResultados" IS NULL;
UPDATE "User" SET "preCampeonatos" = ARRAY[]::TEXT[] WHERE "preCampeonatos" IS NULL;
UPDATE "User" SET "decksMaisUsados" = ARRAY[]::TEXT[] WHERE "decksMaisUsados" IS NULL;

-- Require registration fields
ALTER TABLE "User" ALTER COLUMN "nome" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "sobrenome" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "nick" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "telefone" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "cidade" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "formatos" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "diasDisponiveis" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "horarios" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "melhoresResultados" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "preCampeonatos" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "decksMaisUsados" SET NOT NULL;

-- Rename physical table to users (Prisma model remains User)
ALTER TABLE "User" RENAME TO "users";

ALTER INDEX IF EXISTS "User_pkey" RENAME TO "users_pkey";
ALTER INDEX IF EXISTS "User_email_key" RENAME TO "users_email_key";

CREATE UNIQUE INDEX "users_nick_key" ON "users"("nick");
