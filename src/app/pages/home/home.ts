import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faNewspaper, faStar } from '@fortawesome/free-solid-svg-icons';

import { PortalBrandComponent } from '../../shared/portal-brand/portal-brand';

@Component({
  selector: 'app-home',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    FaIconComponent,
    PortalBrandComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  protected readonly faNewspaper = faNewspaper;
  protected readonly faStar = faStar;

  protected readonly userEmail = signal(localStorage.getItem('user_email') ?? '');
  protected readonly userInitial = computed(() =>
    this.userEmail().charAt(0).toUpperCase(),
  );

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    this.router.navigate(['/login']);
  }
}
