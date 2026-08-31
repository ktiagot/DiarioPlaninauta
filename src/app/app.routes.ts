import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'landing',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.LandingComponent),
    data: { title: 'Diário Planinauta' },
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/portal-layout').then((m) => m.PortalLayoutComponent),
    children: [
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
        data: { title: 'Meu perfil' },
      },
      {
        path: 'perfil/editar',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/perfil-editar/perfil-editar').then((m) => m.PerfilEditarComponent),
        data: { title: 'Editar perfil' },
      },
      {
        path: 'perfil/senha',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/perfil-senha/perfil-senha').then((m) => m.PerfilSenhaComponent),
        data: { title: 'Alterar senha' },
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
        redirectTo: 'precompeonato',
        pathMatch: 'full',
      },
      {
        path: 'comunidade',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/comunidade/comunidade').then(
            (m) => m.ComunidadeComponent,
          ),
        data: { title: 'Comunidade' },
      },
      {
        path: 'precompeonato',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/precompeonato/precompeonato').then((m) => m.PrecompeonatoComponent),
        data: { title: 'Precompeonato' },
      },
      {
        path: 'estatisticas',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/estatisticas/estatisticas').then(
            (m) => m.EstatisticasComponent,
          ),
        data: { title: 'Estatísticas' },
      },
      {
        path: 'mesoes',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/mesoes/mesoes').then(
            (m) => m.MesoesComponent,
          ),
        data: { title: 'Mesões' },
      },
      {
        path: 'loja',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/loja/loja').then(
            (m) => m.LojaComponent,
          ),
        data: { title: 'Loja de Pontos' },
      },
      {
        path: 'regras',
        loadComponent: () =>
          import('./pages/regras/regras').then((m) => m.RegrasComponent),
        data: { title: 'Regras' },
      },
      {
        path: 'sugestoes',
        loadComponent: () =>
          import('./pages/sugestoes/sugestoes').then((m) => m.SugestoesComponent),
        data: { title: 'Sugestões' },
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/admin-layout').then((m) => m.AdminLayoutComponent),
        children: [
          { path: '', redirectTo: 'campeonato', pathMatch: 'full' },
          {
            path: 'campeonato',
            loadComponent: () =>
              import('./pages/admin/campeonato/admin-campeonato').then((m) => m.AdminCampeonatoComponent),
            data: { title: 'Admin — Campeonato' },
          },
          {
            path: 'comunidade',
            loadComponent: () =>
              import('./pages/admin/comunidade/admin-comunidade').then((m) => m.AdminComunidadeComponent),
            data: { title: 'Admin — Comunidade' },
          },
        ],
      },
      {
        path: 'perfil/:userId',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/perfil-publico/perfil-publico').then(
            (m) => m.PerfilPublicoComponent,
          ),
        data: { title: 'Perfil' },
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
