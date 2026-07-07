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

@Component({
  selector: 'app-portal-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.scss',
})
export class PortalHeaderComponent {
  private readonly router = inject(Router);
  private readonly authRevision = signal(0);

  protected readonly logoUrl = PORTAL_LOGO_MINIMAL_URL;
  protected readonly mobileMenuOpen = signal(false);

  protected readonly isAuthenticated = computed(() => {
    this.authRevision();
    return !!localStorage.getItem('access_token');
  });

  protected readonly navItems = computed(() =>
    this.isAuthenticated() ? PORTAL_NAV_ITEMS : PORTAL_GUEST_NAV_ITEMS,
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.authRevision.update((value) => value + 1));
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    this.authRevision.update((value) => value + 1);
    this.router.navigate(['/login']);
  }
}
