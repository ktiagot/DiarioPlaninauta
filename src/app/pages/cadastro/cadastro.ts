import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  forkJoin,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { UsersService } from '../../core/users/users.service';
import { PortalBrandComponent } from '../../shared/portal-brand/portal-brand';

const FORMATOS_DISPONIVEIS = [
  'Standard',
  'Pioneer',
  'Modern',
  'Legacy',
  'Vintage',
  'Commander',
  'Pauper',
  'Limited',
  'Draft',
  'Sealed',
];

const APOIA_SE_URL = 'https://apoia.se/diarioplaninauta';

type BackerStatus = 'idle' | 'checking' | 'backer' | 'not_backer' | 'error';

function minArrayLength(min: number) {
  return (control: AbstractControl<string[]>): ValidationErrors | null =>
    (control.value?.length ?? 0) >= min ? null : { minArrayLength: { min } };
}

/** Compara com o campo senha do mesmo FormGroup — erro no controle para o mat-error renderizar abaixo. */
function confirmarSenhaIgual(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const senha = parent.get('senha')?.value;
  const confirmar = control.value;
  if (!confirmar || !senha) return null;
  return senha === confirmar ? null : { senhasDivergentes: true };
}

function setControlError(control: AbstractControl, key: string, active: boolean): void {
  const current = { ...(control.errors ?? {}) };
  if (active) {
    current[key] = true;
    control.setErrors(current);
    return;
  }
  delete current[key];
  control.setErrors(Object.keys(current).length ? current : null);
}

@Component({
  selector: 'app-cadastro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PortalBrandComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class CadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly formatosDisponiveis = FORMATOS_DISPONIVEIS;
  protected readonly apoiaSeUrl = APOIA_SE_URL;
  protected readonly loading = signal(false);
  protected readonly backerStatus = signal<BackerStatus>('idle');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
    confirmarSenha: ['', [Validators.required, confirmarSenhaIgual]],
    nome: ['', Validators.required],
    sobrenome: ['', Validators.required],
    nick: ['', Validators.required],
    telefone: ['', Validators.required],
    formatos: [[] as string[], [Validators.required, minArrayLength(1)]],
    cidade: ['', Validators.required],
  });

  constructor() {
    this.form.controls.senha.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.controls.confirmarSenha.updateValueAndValidity({ emitEvent: false });
      });

    this.form.controls.email.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap((email) => {
          if (
            !email ||
            this.form.controls.email.hasError('required') ||
            this.form.controls.email.hasError('email')
          ) {
            this.backerStatus.set('idle');
            setControlError(this.form.controls.email, 'emailTaken', false);
          }
        }),
        filter(() => {
          const ctrl = this.form.controls.email;
          return !!ctrl.value && !ctrl.hasError('required') && !ctrl.hasError('email');
        }),
        tap(() => this.backerStatus.set('checking')),
        switchMap((email) =>
          forkJoin({
            backer: this.authService.verifyBacker(email).pipe(
              catchError(() => {
                this.backerStatus.set('error');
                return of(null);
              }),
            ),
            availability: this.usersService.checkAvailability({ email }).pipe(
              catchError(() => of({ emailTaken: null, nickTaken: null })),
            ),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ backer, availability }) => {
        if (backer) {
          this.backerStatus.set(backer.isBacker ? 'backer' : 'not_backer');
        }
        setControlError(this.form.controls.email, 'emailTaken', availability.emailTaken === true);
      });

    this.form.controls.nick.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap((nick) => {
          if (!nick?.trim()) {
            setControlError(this.form.controls.nick, 'nickTaken', false);
          }
        }),
        filter((nick) => !!nick?.trim()),
        switchMap((nick) =>
          this.usersService.checkAvailability({ nick: nick.trim() }).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((availability) => {
        setControlError(this.form.controls.nick, 'nickTaken', availability.nickTaken === true);
      });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { confirmarSenha: _, ...payload } = this.form.getRawValue();
    this.usersService.create(payload).subscribe({
      next: () => {
        this.snackBar.open('Cadastro realizado com sucesso! Faça login para continuar.', 'OK', {
          duration: 6000,
        });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message =
          (typeof err.error?.message === 'string' ? err.error.message : null) ||
          (Array.isArray(err.error?.message) ? err.error.message.join(' ') : null);

        if (err.status === 409) {
          this.applyConflictError(message);
          this.snackBar.open(
            message || 'Já existe um usuário cadastrado com estes dados.',
            'OK',
            { duration: 6000 },
          );
          return;
        }

        this.snackBar.open(
          message ||
            (err.status === 0
              ? 'Serviço temporariamente indisponível.'
              : 'Erro ao cadastrar. Tente novamente.'),
          'OK',
          { duration: 6000 },
        );
      },
    });
  }

  private applyConflictError(message: string | null): void {
    const lower = (message ?? '').toLowerCase();
    if (lower.includes('nick')) {
      setControlError(this.form.controls.nick, 'nickTaken', true);
      this.form.controls.nick.markAsTouched();
      return;
    }
    setControlError(this.form.controls.email, 'emailTaken', true);
    this.form.controls.email.markAsTouched();
  }
}
