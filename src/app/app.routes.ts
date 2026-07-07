import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/portal-layout').then((m) => m.PortalLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
        data: { title: 'Meu perfil' },
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
      },
      {
        path: 'cadastro',
        loadComponent: () => import('./pages/cadastro/cadastro').then((m) => m.CadastroComponent),
      },
      {
        path: 'mesas',
        loadComponent: () => import('./pages/mesas/mesas').then((m) => m.MesasComponent),
        data: { title: 'Mesas' },
      },
      {
        path: 'comunidade',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/page-placeholder/page-placeholder').then(
            (m) => m.PagePlaceholderComponent,
          ),
        data: { title: 'Comunidade' },
      },
      {
        path: 'precompeonato',
        loadComponent: () =>
          import('./pages/precompeonato/precompeonato').then((m) => m.PrecompeonatoComponent),
        data: { title: 'Precompeonato' },
      },
      {
        path: 'estatisticas',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/page-placeholder/page-placeholder').then(
            (m) => m.PagePlaceholderComponent,
          ),
        data: { title: 'Estatisticas' },
      },
      {
        path: 'mesoes',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/page-placeholder/page-placeholder').then(
            (m) => m.PagePlaceholderComponent,
          ),
        data: { title: 'Mesões' },
      },
      {
        path: 'loja',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/page-placeholder/page-placeholder').then(
            (m) => m.PagePlaceholderComponent,
          ),
        data: { title: 'Loja de Pontos' },
      },
      { path: 'perfil', redirectTo: '', pathMatch: 'full' },
    ],
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth/callback/callback').then((m) => m.AuthCallbackComponent),
  },
  { path: '**', redirectTo: '' },
];
