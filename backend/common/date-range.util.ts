// Fuso fixo do projeto: UTC-3 (America/Sao_Paulo, sem horário de verão).
const TZ_OFFSET_MIN = -180;

/**
 * Intervalo [início, fim] do dia de "hoje" em UTC-3, expresso em instantes UTC.
 * Ex.: hoje 00:00:00 (UTC-3) até hoje 23:59:59.999 (UTC-3).
 */
export function hojeRangeUtc(now: Date = new Date()): { inicio: Date; fim: Date } {
  const local = new Date(now.getTime() + TZ_OFFSET_MIN * 60 * 1000);
  const inicioLocalUtcMs = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  const inicio = new Date(inicioLocalUtcMs - TZ_OFFSET_MIN * 60 * 1000);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { inicio, fim };
}
