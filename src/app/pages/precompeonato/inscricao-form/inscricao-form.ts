import {
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { map, startWith } from 'rxjs';

import { InscricoesService } from '../../../core/inscricoes/inscricoes.service';
import {
  DISCORD_URL,
  PRECON_HELP_URL,
  PRECONS_MOCK,
  PRIVACIDADE_URL,
  REGRAS_URL,
} from './inscricao-form.constants';

function requiredTrue(control: AbstractControl): ValidationErrors | null {
  return control.value === true ? null : { requiredTrue: true };
}

@Component({
  selector: 'app-inscricao-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FaIconComponent,
  ],
  templateUrl: './inscricao-form.html',
  styleUrl: './inscricao-form.scss',
})
export class InscricaoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly inscricoesService = inject(InscricoesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();
  readonly submitted = output<void>();

  protected readonly faXmark = faXmark;
  protected readonly precons = PRECONS_MOCK;
  protected readonly preconHelpUrl = PRECON_HELP_URL;
  protected readonly regrasUrl = REGRAS_URL;
  protected readonly privacidadeUrl = PRIVACIDADE_URL;
  protected readonly discordUrl = DISCORD_URL;

  protected readonly submitting = signal(false);
  protected readonly preconSearch = signal('');
  protected readonly comandanteSearch = signal('');

  protected readonly form = this.fb.nonNullable.group({
    discordNick: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    deckNome: ['', [Validators.required]],
    comandante: [{ value: '', disabled: true }, [Validators.required]],
    aceiteTermos: [false, [requiredTrue]],
    aceitePrivacidade: [false, [requiredTrue]],
    entrouDiscord: [false, [requiredTrue]],
  });

  private readonly selectedDeckNome = signal('');

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      map(() => this.form.valid && !!this.form.controls.comandante.value),
    ),
    { initialValue: false },
  );

  protected readonly canSubmit = computed(
    () => this.formValid() && !this.submitting(),
  );

  protected readonly comandantesDisponiveis = computed(() => {
    const deckNome = this.selectedDeckNome();
    if (!deckNome) return [];
    return this.precons.find((p) => p.nome === deckNome)?.comandantes ?? [];
  });

  protected readonly preconsFiltrados = computed(() => {
    const term = this.preconSearch().trim().toLowerCase();
    if (!term) return this.precons;
    return this.precons.filter((p) => p.nome.toLowerCase().includes(term));
  });

  protected readonly comandantesFiltrados = computed(() => {
    const term = this.comandanteSearch().trim().toLowerCase();
    const list = this.comandantesDisponiveis();
    if (!term) return list;
    return list.filter((cmd) => cmd.toLowerCase().includes(term));
  });

  constructor() {
    this.form.controls.deckNome.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nome) => {
        this.selectedDeckNome.set(nome);
        this.preconSearch.set('');
        this.comandanteSearch.set('');
        const comandanteCtrl = this.form.controls.comandante;
        comandanteCtrl.reset('');
        if (nome) {
          comandanteCtrl.enable({ emitEvent: false });
        } else {
          comandanteCtrl.disable({ emitEvent: false });
        }
        // statusChanges não emite ao só habilitar/desabilitar com emitEvent:false
        this.form.updateValueAndValidity({ emitEvent: true });
      });

    this.form.controls.comandante.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.comandanteSearch.set('');
      });
  }

  protected onPreconSearchInput(event: Event): void {
    this.preconSearch.set((event.target as HTMLInputElement).value);
  }

  protected onComandanteSearchInput(event: Event): void {
    this.comandanteSearch.set((event.target as HTMLInputElement).value);
  }

  protected onPreconOpenedChange(open: boolean): void {
    if (!open) {
      this.preconSearch.set('');
    }
  }

  protected onComandanteOpenedChange(open: boolean): void {
    if (!open) {
      this.comandanteSearch.set('');
    }
  }

  protected close(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.submitting.set(true);

    this.inscricoesService
      .createInscricao({
        discordNick: raw.discordNick.trim(),
        email: raw.email.trim(),
        deckNome: raw.deckNome,
        comandante: raw.comandante,
        aceiteTermos: raw.aceiteTermos,
        aceitePrivacidade: raw.aceitePrivacidade,
        entrouDiscord: raw.entrouDiscord,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open('Inscrição realizada com sucesso!', 'Fechar', {
            duration: 4000,
          });
          this.submitted.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const message =
            (typeof err.error?.message === 'string' && err.error.message) ||
            (Array.isArray(err.error?.message) && err.error.message[0]) ||
            'Não foi possível realizar a inscrição.';
          this.snackBar.open(message, 'Fechar', { duration: 5000 });
        },
      });
  }
}
