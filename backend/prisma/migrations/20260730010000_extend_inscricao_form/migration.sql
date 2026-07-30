-- AlterTable: make deckUrl optional and add form fields
ALTER TABLE "inscricoes" ALTER COLUMN "deckUrl" DROP NOT NULL;

ALTER TABLE "inscricoes" ADD COLUMN "discordNick" TEXT;
ALTER TABLE "inscricoes" ADD COLUMN "aceitePrivacidade" BOOLEAN;
ALTER TABLE "inscricoes" ADD COLUMN "entrouDiscord" BOOLEAN;

-- Backfill existing rows
UPDATE "inscricoes"
SET
  "discordNick" = COALESCE(NULLIF(TRIM("email"), ''), 'desconhecido'),
  "aceitePrivacidade" = "aceiteTermos",
  "entrouDiscord" = "aceiteTermos"
WHERE "discordNick" IS NULL;

ALTER TABLE "inscricoes" ALTER COLUMN "discordNick" SET NOT NULL;
ALTER TABLE "inscricoes" ALTER COLUMN "aceitePrivacidade" SET NOT NULL;
ALTER TABLE "inscricoes" ALTER COLUMN "entrouDiscord" SET NOT NULL;
