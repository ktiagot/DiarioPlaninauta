-- Recuperação de senha: hash do código enviado por e-mail + validade.
ALTER TABLE "users" ADD COLUMN "resetSenhaHash" TEXT;
ALTER TABLE "users" ADD COLUMN "resetSenhaExpiraEm" TIMESTAMP(3);
