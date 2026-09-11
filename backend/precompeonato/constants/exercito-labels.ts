import { Exercito } from '@prisma/client';

export const EXERCITO_LABEL: Record<Exercito, string> = {
  [Exercito.ANAOS]: 'Anãos',
  [Exercito.HUMANOS]: 'Humanos',
  [Exercito.ELFOS]: 'Elfos',
  [Exercito.WARGS]: 'Wargs',
  [Exercito.ORCS]: 'Orcs',
};

export function exercitoLabel(exercito: Exercito | null | undefined): string | null {
  return exercito ? EXERCITO_LABEL[exercito] : null;
}
