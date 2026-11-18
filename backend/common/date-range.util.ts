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

/** Intervalo [início, fim) do mês civil (UTC-3) que contém `d`, em instantes UTC. */
export function mesRangeUtc(d: Date): { inicio: Date; fim: Date } {
  const local = new Date(d.getTime() + TZ_OFFSET_MIN * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  return {
    inicio: new Date(Date.UTC(y, m, 1) - TZ_OFFSET_MIN * 60 * 1000),
    fim: new Date(Date.UTC(y, m + 1, 1) - TZ_OFFSET_MIN * 60 * 1000),
  };
}
