-- Campeonatos passam a nascer como RASCUNHO (publicados manualmente pelo admin).
ALTER TABLE "campeonatos" ALTER COLUMN "status" SET DEFAULT 'RASCUNHO';
