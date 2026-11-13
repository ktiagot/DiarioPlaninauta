-- AlterTable
ALTER TABLE "inscricoes" ADD COLUMN "pontosAjuste" INTEGER NOT NULL DEFAULT 0;

-- Preserva os pontos atuais: ajuste = pontos armazenados - pontos derivados das mesas
-- de rodadas finalizadas (1º=3, 2º=1, empate=1 por empatado).
UPDATE "inscricoes" i
SET "pontosAjuste" = i."pontos" - COALESCE((
  SELECT SUM(
    CASE
      WHEN m."empate" AND cardinality(m."empatadosInscricaoIds") > 0 THEN
        CASE WHEN j."inscricaoId" = ANY (m."empatadosInscricaoIds") THEN 1 ELSE 0 END
      WHEN j."posicaoFinal" = 1 THEN 3
      WHEN j."posicaoFinal" = 2 THEN 1
      ELSE 0
    END
  )
  FROM "mesa_torneio_jogadores" j
  JOIN "mesas_torneio" m ON m."id" = j."mesaId"
  JOIN "rodadas" r ON r."id" = m."rodadaId"
  WHERE j."inscricaoId" = i."id" AND r."finalizada" = true
), 0);
