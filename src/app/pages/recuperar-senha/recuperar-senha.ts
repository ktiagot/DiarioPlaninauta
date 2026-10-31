import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';

/** Confirma que a nova senha e a confirmação são iguais. */
function confirmarSenhaIgual(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const nova = parent.get('novaSenha')?.value;
  if (!control.value || !nova) return null;
  return nova === control.value ? null : { senhasDivergentes: true };
}

@Component({
  selector: 'app-recuperar-senha',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** 'solicitar' = pede o e-mail; 'redefinir' = informa código + nova senha. */
  protected readonly etapa = signal<'solicitar' | 'redefinir'>('solicitar');
  protected readonly enviando = signal(false);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly resetForm = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    novaSenha: ['', [Validators.required, Validators.minLength(8)]],
    confirmarSenha: ['', [Validators.required, confirmarSenhaIgual]],
  });

  constructor() {
    this.resetForm.controls.novaSenha.valueChanges.subscribe(() => {
      this.resetForm.controls.confirmarSenha.updateValueAndValidity({ emitEvent: false });
    });
  }

  solicitar(): void {
    if (this.emailForm.invalid || this.enviando()) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const email = this.emailForm.getRawValue().email.trim();

    this.authService.esqueciSenha(email).subscribe({
      next: () => {
        this.enviando.set(false);
        this.etapa.set('redefinir');
        this.snackBar.open(
          'Se houver uma conta com esse e-mail, você receberá um código em instantes.',
          'OK',
          { duration: 6000 },
        );
      },
      error: () => {
        this.enviando.set(false);
        // Resposta genérica mesmo em erro, para não revelar inexistência.
        this.etapa.set('redefinir');
        this.snackBar.open(
          'Se houver uma conta com esse e-mail, você receberá um código em instantes.',
          'OK',
          { duration: 6000 },
        );
      },
    });
  }

  redefinir(): void {
    if (this.resetForm.invalid || this.enviando()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const email = this.emailForm.getRawValue().email.trim();
    const { codigo, novaSenha } = this.resetForm.getRawValue();

    this.authService.resetSenha(email, codigo.trim(), novaSenha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.snackBar.open('Senha redefinida com sucesso! Faça login.', 'OK', {
          duration: 6000,
        });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        const message =
          (typeof err.error?.message === 'string' ? err.error.message : null) ||
          'Código inválido ou expirado. Solicite um novo código.';
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }

  voltarParaEmail(): void {
    this.etapa.set('solicitar');
  }
}
