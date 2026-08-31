import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';

/** Confirma que a nova senha e a confirmação são iguais. */
function confirmarSenhaIgual(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const nova = parent.get('novaSenha')?.value;
  const confirmar = control.value;
  if (!confirmar || !nova) return null;
  return nova === confirmar ? null : { senhasDivergentes: true };
}

@Component({
  selector: 'app-perfil-senha',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './perfil-senha.html',
  styleUrl: './perfil-senha.scss',
})
export class PerfilSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    senhaAtual: ['', Validators.required],
    novaSenha: ['', [Validators.required, Validators.minLength(8)]],
    confirmarSenha: ['', [Validators.required, confirmarSenhaIgual]],
  });

  constructor() {
    this.form.controls.novaSenha.valueChanges.subscribe(() => {
      this.form.controls.confirmarSenha.updateValueAndValidity({ emitEvent: false });
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const { senhaAtual, novaSenha } = this.form.getRawValue();
    this.saving.set(true);

    this.authService.changePassword(senhaAtual, novaSenha).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Senha alterada com sucesso!', 'OK', { duration: 5000 });
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const message =
          (typeof err.error?.message === 'string' ? err.error.message : null) ||
          (err.status === 401
            ? 'A senha atual está incorreta.'
            : 'Não foi possível alterar a senha.');
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }
}
