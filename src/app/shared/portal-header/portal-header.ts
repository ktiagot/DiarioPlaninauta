import { Component, HostListener, computed, ElementRef, inject, signal } from '@angular/core';
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
  PortalNavItem,
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
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly logoUrl = PORTAL_LOGO_MINIMAL_URL;
  protected readonly mobileMenuOpen = signal(false);
  protected readonly openGroup = signal<string | null>(null);
  private readonly currentUrl = signal(this.router.url);

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
      .subscribe((event) => {
        this.currentUrl.set((event as NavigationEnd).urlAfterRedirects);
        this.openGroup.set(null);
      });
  }

  protected toggleGroup(label: string): void {
    this.openGroup.update((g) => (g === label ? null : label));
  }

  protected isGroupActive(item: PortalNavItem): boolean {
    const url = this.currentUrl().split(/[?#]/)[0];
    return (item.children ?? []).some(
      (c) => !!c.path && (url === c.path || url.startsWith(c.path + '/')),
    );
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.openGroup.set(null);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.openGroup.set(null);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.session.clear();
    // Hard reload para descartar qualquer estado em memória (serviços singleton,
    // signals, polling de notificações) — simétrico ao login.
    window.location.href = '/login';
  }
}
