export interface PreconOption {
  nome: string;
  comandantes: string[];
}

export const PRECONS_MOCK: PreconOption[] = [
  {
    nome: 'Counter Intelligence',
    comandantes: ['Phelia, Exuberant Shepherd', 'Aminatou, the Fateshifter'],
  },
  {
    nome: 'Living Energy',
    comandantes: ['Zimone, Paradox Mage', 'Jyoti, Moag Ancient'],
  },
  {
    nome: 'Eternal Might',
    comandantes: ['Teval, the Balanced Scale', 'Kotis, the Fangkeeper'],
  },
  {
    nome: 'World Shaper',
    comandantes: ['Henzie "Toolbox" Torre', 'Gonti, Night Minister'],
  },
  {
    nome: 'Grave Danger',
    comandantes: ['Sidisi, Brood Tyrant', 'The Scarab God'],
  },
];

/** Lista oficial de precons (Scryfall / Wizards). */
export const PRECON_HELP_URL =
  'https://scryfall.com/search?q=is%3Acommander+is%3Aprecon&unique=cards&as=grid&order=name';

export const REGRAS_URL = 'https://diarioplaninauta.com.br';
export const PRIVACIDADE_URL = 'https://diarioplaninauta.com.br';
export const DISCORD_URL = 'https://discord.gg/diarioplaninauta';
