import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
import { SessionService } from '../../core/auth/session.service';
import { PortalBrandComponent } from '../../shared/portal-brand/portal-brand';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    PortalBrandComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  protected readonly loading = signal(false);

  constructor(
    private authService: AuthService,
    private session: SessionService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  createAccount(): void {
    this.router.navigate(['/cadastro']);
  }

  goToApoiaSe(): void {
    window.open('https://apoia.se/diarioplaninauta', '_blank');
  }

  login(form: NgForm): void {
    if (form.invalid || this.loading()) return;

    this.loading.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.session.setSession({
          accessToken: res.accessToken,
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          isAdmin: !!res.user.isAdmin,
        });
        window.location.href = '/';
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message =
          err.error?.message ||
          (err.status === 0
            ? 'Serviço temporariamente indisponível'
            : 'Erro ao entrar. Tente novamente.');
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }
}
