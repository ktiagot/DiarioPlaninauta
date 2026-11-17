// Prazo do check-in: dias antes da data da rodada, às 14h (America/Sao_Paulo, UTC-3).
export const CHECKIN_DIAS_ANTES = 1;
export const CHECKIN_HORA_LIMITE = 14;
const TZ_OFFSET_HORAS = 3;

const DIAS_SEMANA = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

/** `dataRodada` é guardada como data (12:00 UTC do dia da rodada). */
export function prazoCheckIn(dataRodada: Date): Date {
  return new Date(
    Date.UTC(
      dataRodada.getUTCFullYear(),
      dataRodada.getUTCMonth(),
      dataRodada.getUTCDate() - CHECKIN_DIAS_ANTES,
      CHECKIN_HORA_LIMITE + TZ_OFFSET_HORAS,
    ),
  );
}

export function checkInEncerrado(dataRodada: Date, now: Date = new Date()): boolean {
  return now.getTime() >= prazoCheckIn(dataRodada).getTime();
}

/** Ex.: "quarta-feira (18/11) às 14h". */
export function prazoCheckInLabel(dataRodada: Date): string {
  const d = new Date(
    Date.UTC(
      dataRodada.getUTCFullYear(),
      dataRodada.getUTCMonth(),
      dataRodada.getUTCDate() - CHECKIN_DIAS_ANTES,
    ),
  );
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${DIAS_SEMANA[d.getUTCDay()]} (${dd}/${mm}) às ${CHECKIN_HORA_LIMITE}h`;
}
