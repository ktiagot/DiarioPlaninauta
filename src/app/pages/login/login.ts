import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
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
  protected readonly loading = signal(false);

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  login(form: NgForm): void {
    if (form.invalid || this.loading()) return;

    this.loading.set(true);

    this.authService.requestLogin(this.email).subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('user_email', res.user.email);
        localStorage.setItem('user_role', res.user.role);
        window.location.href = '/';
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message =
          err.error?.message ||
          (err.status === 401
            ? 'Você não é apoiador ativo no APOIA.se.'
            : err.status === 0
              ? 'Serviço temporariamente indisponível'
              : 'Erro ao entrar. Tente novamente.');
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }
}
