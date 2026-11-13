-- Generaliza "exercito" (enum fixo) para "grupo" configuravel por campeonato.
-- Preserva os dados existentes: converte cada valor de exercito em um
-- GrupoCampeonato do respectivo campeonato e religa a inscricao via grupoId.

-- 1) Flag no campeonato
ALTER TABLE "campeonatos" ADD COLUMN "usaGrupos" BOOLEAN NOT NULL DEFAULT false;

-- 2) Tabela de grupos por campeonato
CREATE TABLE "grupos_campeonato" (
    "id" TEXT NOT NULL,
    "campeonatoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "grupos_campeonato_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "grupos_campeonato_campeonatoId_nome_key" ON "grupos_campeonato"("campeonatoId", "nome");
CREATE INDEX "grupos_campeonato_campeonatoId_idx" ON "grupos_campeonato"("campeonatoId");
ALTER TABLE "grupos_campeonato"
    ADD CONSTRAINT "grupos_campeonato_campeonatoId_fkey"
    FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) Nova coluna de referencia na inscricao
ALTER TABLE "inscricoes" ADD COLUMN "grupoId" TEXT;

-- 4) Conversao dos dados: para cada (campeonato, exercito) distinto existente,
--    cria um grupo com o label PT-BR e religa as inscricoes.
DO $$
DECLARE
    rec RECORD;
    novo_grupo_id TEXT;
    label TEXT;
    ord INTEGER;
BEGIN
    FOR rec IN
        SELECT DISTINCT "campeonatoId", "exercito"
        FROM "inscricoes"
        WHERE "exercito" IS NOT NULL
    LOOP
        label := CASE rec."exercito"::text
            WHEN 'ANAOS'   THEN 'Anãos'
            WHEN 'HUMANOS' THEN 'Humanos'
            WHEN 'ELFOS'   THEN 'Elfos'
            WHEN 'WARGS'   THEN 'Wargs'
            WHEN 'ORCS'    THEN 'Orcs'
            ELSE rec."exercito"::text
        END;
        ord := CASE rec."exercito"::text
            WHEN 'ANAOS'   THEN 1
            WHEN 'HUMANOS' THEN 2
            WHEN 'ELFOS'   THEN 3
            WHEN 'WARGS'   THEN 4
            WHEN 'ORCS'    THEN 5
            ELSE 99
        END;

        novo_grupo_id := gen_random_uuid()::text;
        INSERT INTO "grupos_campeonato" ("id", "campeonatoId", "nome", "ordem", "createdAt", "updatedAt")
        VALUES (novo_grupo_id, rec."campeonatoId", label, ord, now(), now());

        UPDATE "inscricoes"
        SET "grupoId" = novo_grupo_id
        WHERE "campeonatoId" = rec."campeonatoId" AND "exercito" = rec."exercito";
    END LOOP;

    -- Marca como "usa grupos" qualquer campeonato que tinha exercito definido.
    UPDATE "campeonatos" c
    SET "usaGrupos" = true
    WHERE EXISTS (
        SELECT 1 FROM "grupos_campeonato" g WHERE g."campeonatoId" = c."id"
    );
END $$;

-- 5) FK + indice da nova coluna
ALTER TABLE "inscricoes"
    ADD CONSTRAINT "inscricoes_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "grupos_campeonato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "inscricoes_grupoId_idx" ON "inscricoes"("grupoId");

-- 6) Remove a coluna antiga e o enum
ALTER TABLE "inscricoes" DROP COLUMN "exercito";
DROP TYPE "Exercito";
