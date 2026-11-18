const TZ = 'America/Sao_Paulo';

export function formatDataHoraBr(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
    .format(d)
    .replace(',', ' às');
}
