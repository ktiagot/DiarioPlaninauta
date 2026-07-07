export const FORMATOS_DISPONIVEIS = [
  'Standard',
  'Pioneer',
  'Modern',
  'Legacy',
  'Vintage',
  'Commander',
  'Pauper',
  'Limited',
  'Draft',
  'Sealed',
] as const;

export type FormatoDisponivel = (typeof FORMATOS_DISPONIVEIS)[number];
