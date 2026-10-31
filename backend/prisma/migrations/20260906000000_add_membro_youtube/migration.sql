-- Membro YouTube: status validado por import de CSV no admin.
ALTER TABLE "users" ADD COLUMN "isMembroYoutube" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "membroYoutubeDesde" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "membroYoutubeValidadoEm" TIMESTAMP(3);

-- Acesso ao portal = apoiador ativo OU membro YT; índice ajuda os filtros.
CREATE INDEX "users_isMembroYoutube_idx" ON "users"("isMembroYoutube");
