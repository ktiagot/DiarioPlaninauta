export type TemaModo = 'PADRAO' | 'PERSONALIZADO';

export interface Tema {
  modo: TemaModo;
  primary: string;
  primaryStrong: string;
  onPrimary: string;
  bg: string;
  text: string;
}

/** Cores do tema padrão (espelham os defaults do :root em styles.scss). */
export const TEMA_PADRAO: Tema = {
  modo: 'PADRAO',
  primary: '#f58220',
  primaryStrong: '#ff6b00',
  onPrimary: '#ffffff',
  bg: '#000000',
  text: '#ffffff',
};
