import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';

import {
  PORTAL_GUEST_NAV_ITEMS,
  PORTAL_LOGO_MINIMAL_URL,
  PORTAL_NAV_ITEMS,
} from './portal-header.constants';
import { SessionService } from '../../core/auth/session.service';
import { NotificacoesSinoComponent } from '../notificacoes-sino/notificacoes-sino';

@Component({
  selector: 'app-portal-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule, NotificacoesSinoComponent],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.scss',
})
export class PortalHeaderComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  protected readonly logoUrl = PORTAL_LOGO_MINIMAL_URL;
  protected readonly mobileMenuOpen = signal(false);

  protected readonly isAuthenticated = computed(() => {
    this.session.authRevision();
    return this.session.isAuthenticated();
  });

  protected readonly isAdminUser = computed(() => {
    this.session.authRevision();
    return this.session.isAdmin();
  });

  protected readonly navItems = computed(() => {
    if (!this.isAuthenticated()) return PORTAL_GUEST_NAV_ITEMS;
    if (this.isAdminUser()) {
      return [...PORTAL_NAV_ITEMS, { label: 'Admin', path: '/admin' }];
    }
    return PORTAL_NAV_ITEMS;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        // force recompute on navigation
      });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/login']);
  }
}
