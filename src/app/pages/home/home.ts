import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faNewspaper, faStar } from '@fortawesome/free-solid-svg-icons';
import { filter } from 'rxjs';

import { APOIA_SE_URL } from '../../shared/portal-header/portal-header.constants';
import { PortalBrandComponent } from '../../shared/portal-brand/portal-brand';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    FaIconComponent,
    PortalBrandComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly authRevision = signal(0);

  protected readonly faNewspaper = faNewspaper;
  protected readonly faStar = faStar;
  protected readonly apoiaSeUrl = APOIA_SE_URL;

  protected readonly isAuthenticated = computed(() => {
    this.authRevision();
    return !!localStorage.getItem('access_token');
  });

  protected readonly userEmail = computed(() => {
    this.authRevision();
    return localStorage.getItem('user_email') ?? '';
  });

  protected readonly userInitial = computed(() =>
    this.userEmail().charAt(0).toUpperCase(),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.authRevision.update((value) => value + 1));
  }
}
