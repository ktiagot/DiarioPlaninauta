export const PORTAL_LOGO_MINIMAL_URL = '/assets/images/logo-minimalista-laranja.png';
export const APOIA_SE_URL = 'https://apoia.se/diarioplaninauta';

export interface PortalNavItem {
  label: string;
  path?: string;
  href?: string;
  exact?: boolean;
  external?: boolean;
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Home', path: '/', exact: true },
  { label: 'Comunidade', path: '/comunidade' },
  { label: 'Precompeonato', path: '/precompeonato' },
  { label: 'Estatisticas', path: '/estatisticas' },
  { label: 'Mesões', path: '/mesoes' },
  { label: 'Loja de Pontos', path: '/loja' },
];

export const PORTAL_GUEST_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Home', path: '/', exact: true },
  { label: 'Login', path: '/login', exact: true },
  { label: 'Apoia-se', href: APOIA_SE_URL, external: true },
];
