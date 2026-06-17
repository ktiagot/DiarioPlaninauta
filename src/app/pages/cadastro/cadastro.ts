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

function senhasIguais(group: AbstractControl): ValidationErrors | null {
  const senha = group.get('senha')?.value;
  const confirmarSenha = group.get('confirmarSenha')?.value;
  return senha && confirmarSenha && senha !== confirmarSenha ? { senhasDivergentes: true } : null;
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

  protected readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required],
      nome: ['', Validators.required],
      sobrenome: ['', Validators.required],
      nick: ['', Validators.required],
      telefone: ['', Validators.required],
      formatos: [[] as string[], [Validators.required, minArrayLength(1)]],
      cidade: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  constructor() {
    this.form.controls.email.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap((email) => {
          if (!email || this.form.controls.email.invalid) {
            this.backerStatus.set('idle');
          }
        }),
        filter(() => this.form.controls.email.valid),
        tap(() => this.backerStatus.set('checking')),
        switchMap((email) =>
          this.authService.verifyBacker(email).pipe(
            catchError(() => {
              this.backerStatus.set('error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.backerStatus.set(res.isBacker ? 'backer' : 'not_backer');
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
          err.error?.message ||
          (err.status === 409
            ? 'Já existe um usuário cadastrado com este e-mail.'
            : err.status === 0
              ? 'Serviço temporariamente indisponível.'
              : 'Erro ao cadastrar. Tente novamente.');
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }
}
