import { HttpErrorResponse } from '@angular/common/http';

const TZ = 'America/Sao_Paulo';

/** Ex.: "terça-feira, 04/08 às 20:00". */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    timeZone: TZ,
  }).format(d);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(d);
  return `${dia} às ${hora}`;
}

/** Valor de `<input type="datetime-local">` (horário de Brasília) -> ISO com offset. */
export function inputLocalParaIso(valor: string): string {
  return `${valor}:00-03:00`;
}

/** ISO -> valor de `<input type="datetime-local">` em horário de Brasília. */
export function isoParaInputLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(iso));
  return parts.replace(' ', 'T');
}

export function mensagemErro(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const m = err.error?.message;
    if (typeof m === 'string' && m) return m;
    if (Array.isArray(m) && typeof m[0] === 'string') return m[0];
  }
  return fallback;
}
