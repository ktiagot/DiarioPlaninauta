-- CreateTable
CREATE TABLE "precons" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "setNome" TEXT NOT NULL,
    "cores" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "banido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precon_comandantes" (
    "id" TEXT NOT NULL,
    "preconId" TEXT NOT NULL,
    "comandante" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precon_comandantes_pkey" PRIMARY KEY ("id")
);

-- Seed catalog precons (Tarkir: Dragonstorm Commander precons)
INSERT INTO "precons" ("id", "nome", "setNome", "cores", "ano", "banido", "createdAt", "updatedAt") VALUES
  ('p0000001-0000-4000-8000-000000000001', 'Counter Intelligence', 'Tarkir: Dragonstorm', 'WU', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('p0000001-0000-4000-8000-000000000002', 'Living Energy', 'Tarkir: Dragonstorm', 'GU', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('p0000001-0000-4000-8000-000000000003', 'Eternal Might', 'Tarkir: Dragonstorm', 'RG', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('p0000001-0000-4000-8000-000000000004', 'World Shaper', 'Tarkir: Dragonstorm', 'BG', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('p0000001-0000-4000-8000-000000000005', 'Grave Danger', 'Tarkir: Dragonstorm', 'UB', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "precon_comandantes" ("id", "preconId", "comandante", "ordem", "createdAt", "updatedAt") VALUES
  ('c0000001-0000-4000-8000-000000000001', 'p0000001-0000-4000-8000-000000000001', 'Phelia, Exuberant Shepherd', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000002', 'p0000001-0000-4000-8000-000000000001', 'Aminatou, the Fateshifter', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000003', 'p0000001-0000-4000-8000-000000000002', 'Zimone, Paradox Mage', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000004', 'p0000001-0000-4000-8000-000000000002', 'Jyoti, Moag Ancient', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000005', 'p0000001-0000-4000-8000-000000000003', 'Teval, the Balanced Scale', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000006', 'p0000001-0000-4000-8000-000000000003', 'Kotis, the Fangkeeper', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000007', 'p0000001-0000-4000-8000-000000000004', 'Henzie "Toolbox" Torre', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000008', 'p0000001-0000-4000-8000-000000000004', 'Gonti, Night Minister', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-000000000009', 'p0000001-0000-4000-8000-000000000005', 'Sidisi, Brood Tyrant', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c0000001-0000-4000-8000-00000000000a', 'p0000001-0000-4000-8000-000000000005', 'The Scarab God', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add FK columns to inscricoes (nullable during migration)
ALTER TABLE "inscricoes" ADD COLUMN "preconId" TEXT;
ALTER TABLE "inscricoes" ADD COLUMN "preconComandanteId" TEXT;

-- Migrate existing inscricoes: match by deckNome (case-insensitive) and comandante
UPDATE "inscricoes" i
SET
  "preconId" = p."id",
  "preconComandanteId" = pc."id"
FROM "precons" p
JOIN "precon_comandantes" pc ON pc."preconId" = p."id"
WHERE lower(trim(i."deckNome")) = lower(trim(p."nome"))
  AND lower(trim(i."comandante")) = lower(trim(pc."comandante"));

-- Legacy precons for unmatched inscricoes (one precon per distinct deckNome+comandante)
DO $$
DECLARE
  rec RECORD;
  new_precon_id TEXT;
  new_cmd_id TEXT;
BEGIN
  FOR rec IN
    SELECT DISTINCT trim(i."deckNome") AS deck_nome, trim(i."comandante") AS comandante
    FROM "inscricoes" i
    WHERE i."preconId" IS NULL
  LOOP
    new_precon_id := gen_random_uuid()::text;
    new_cmd_id := gen_random_uuid()::text;

    INSERT INTO "precons" ("id", "nome", "setNome", "cores", "ano", "banido", "createdAt", "updatedAt")
    VALUES (new_precon_id, rec.deck_nome, 'Legado', '—', 0, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    INSERT INTO "precon_comandantes" ("id", "preconId", "comandante", "ordem", "createdAt", "updatedAt")
    VALUES (new_cmd_id, new_precon_id, rec.comandante, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    UPDATE "inscricoes"
    SET "preconId" = new_precon_id, "preconComandanteId" = new_cmd_id
    WHERE "preconId" IS NULL
      AND trim("deckNome") = rec.deck_nome
      AND trim("comandante") = rec.comandante;
  END LOOP;
END $$;

-- Drop old columns and enforce NOT NULL
ALTER TABLE "inscricoes" DROP COLUMN "deckNome";
ALTER TABLE "inscricoes" DROP COLUMN "comandante";
ALTER TABLE "inscricoes" ALTER COLUMN "preconId" SET NOT NULL;
ALTER TABLE "inscricoes" ALTER COLUMN "preconComandanteId" SET NOT NULL;

-- Optional FK on mesa_jogadores
ALTER TABLE "mesa_jogadores" ADD COLUMN "preconId" TEXT;
ALTER TABLE "mesa_jogadores" ADD COLUMN "preconComandanteId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "precon_comandantes_preconId_comandante_key" ON "precon_comandantes"("preconId", "comandante");
CREATE INDEX "precon_comandantes_preconId_idx" ON "precon_comandantes"("preconId");
CREATE INDEX "inscricoes_preconId_idx" ON "inscricoes"("preconId");
CREATE INDEX "inscricoes_preconComandanteId_idx" ON "inscricoes"("preconComandanteId");
CREATE INDEX "mesa_jogadores_preconId_idx" ON "mesa_jogadores"("preconId");
CREATE INDEX "mesa_jogadores_preconComandanteId_idx" ON "mesa_jogadores"("preconComandanteId");

-- AddForeignKey
ALTER TABLE "precon_comandantes" ADD CONSTRAINT "precon_comandantes_preconId_fkey" FOREIGN KEY ("preconId") REFERENCES "precons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_preconId_fkey" FOREIGN KEY ("preconId") REFERENCES "precons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_preconComandanteId_fkey" FOREIGN KEY ("preconComandanteId") REFERENCES "precon_comandantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mesa_jogadores" ADD CONSTRAINT "mesa_jogadores_preconId_fkey" FOREIGN KEY ("preconId") REFERENCES "precons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mesa_jogadores" ADD CONSTRAINT "mesa_jogadores_preconComandanteId_fkey" FOREIGN KEY ("preconComandanteId") REFERENCES "precon_comandantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
