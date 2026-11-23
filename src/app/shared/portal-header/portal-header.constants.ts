export const PORTAL_LOGO_MINIMAL_URL = '/assets/images/logo-minimalista-laranja.png';
export const APOIA_SE_URL = 'https://apoia.se/diarioplaninauta';

export interface PortalNavItem {
  label: string;
  path?: string;
  href?: string;
  exact?: boolean;
  external?: boolean;
  /** Submenu (dropdown). Itens do grupo não têm path próprio. */
  children?: PortalNavItem[];
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Precompeonato', path: '/precompeonato' },
  {
    label: 'Comunidade',
    children: [
      { label: 'Apoiadores', path: '/comunidade' },
      { label: 'Estatisticas', path: '/estatisticas' },
      { label: 'Hall da Fama', path: '/hall-da-fama' },
    ],
  },
  { label: 'Mesões', path: '/mesoes' },
  { label: 'Mesão ao Vivo', path: '/mesao-live' },
  { label: 'Análise de Deck', path: '/analises' },
  { label: 'Loja de Pontos', path: '/loja' },
  {
    label: 'Mais',
    children: [
      { label: 'Parceiros', path: '/parceiros' },
      { label: 'Sugestões', path: '/sugestoes' },
    ],
  },
];
export const PORTAL_GUEST_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Login', path: '/login', exact: true },
  { label: 'Cadastro', path: '/cadastro', exact: true },
  { label: 'Hall da Fama', path: '/hall-da-fama' },
  { label: 'Parceiros', path: '/parceiros' },
  { label: 'Sugestões', path: '/sugestoes' },
  { label: 'Apoia-se', href: APOIA_SE_URL, external: true },
];
