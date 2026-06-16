import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
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
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth/callback/callback').then((m) => m.AuthCallbackComponent),
  },
  { path: '**', redirectTo: '' },
];
