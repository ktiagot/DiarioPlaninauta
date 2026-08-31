-- Adiciona o status RASCUNHO ao enum de status de campeonato.
ALTER TYPE "CampeonatoStatus" ADD VALUE IF NOT EXISTS 'RASCUNHO' BEFORE 'INSCRICOES_ABERTAS';
