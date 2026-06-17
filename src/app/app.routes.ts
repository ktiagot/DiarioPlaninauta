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
        loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
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
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/page-placeholder/page-placeholder').then(
            (m) => m.PagePlaceholderComponent,
          ),
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
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/page-placeholder/page-placeholder').then(
            (m) => m.PagePlaceholderComponent,
          ),
        data: { title: 'Meu perfil' },
      },
    ],
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth/callback/callback').then((m) => m.AuthCallbackComponent),
  },
  { path: '**', redirectTo: '' },
];
