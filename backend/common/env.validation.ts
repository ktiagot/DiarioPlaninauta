/**
 * Validação mínima das variáveis de ambiente no boot. Falha cedo (ao subir a
 * app) em vez de só quebrar em runtime quando a variável for usada.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const obrigatorias = ['DATABASE_URL', 'JWT_SECRET'];
  const faltando = obrigatorias.filter((k) => {
    const v = config[k];
    return v === undefined || v === null || String(v).trim() === '';
  });

  if (faltando.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes: ${faltando.join(', ')}. ` +
        'Verifique o arquivo .env (veja .env.example).',
    );
  }

  return config;
}
