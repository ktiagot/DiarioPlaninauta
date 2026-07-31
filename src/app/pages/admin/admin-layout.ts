import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <h1 class="admin-layout__title">Painel Administrativo</h1>
      <nav class="admin-layout__nav">
        <a
          routerLink="/admin/campeonato"
          routerLinkActive="admin-layout__nav-link--active"
          class="admin-layout__nav-link"
        >
          Campeonato
        </a>
        <a
          routerLink="/admin/comunidade"
          routerLinkActive="admin-layout__nav-link--active"
          class="admin-layout__nav-link"
        >
          Comunidade
        </a>
      </nav>
      <div class="admin-layout__content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1rem;

      &__title {
        font-size: 1.75rem;
        font-weight: 800;
        color: #fff;
        margin-bottom: 1.5rem;
      }

      &__nav {
        display: flex;
        gap: 0;
        border-bottom: 2px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 1.5rem;
      }

      &__nav-link {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: color 0.2s, border-color 0.2s;

        &:hover {
          color: #fff;
        }

        &--active {
          color: #f58220;
          border-bottom-color: #f58220;
        }
      }

      &__content {
        min-height: 400px;
      }
    }
  `],
})
export class AdminLayoutComponent {}
