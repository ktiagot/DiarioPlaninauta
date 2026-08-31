import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
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
import { PreconComandante, PreconListItem } from '../../../core/precons/precons.models';
import { PreconsService } from '../../../core/precons/precons.service';
import {
  DISCORD_URL,
  PRECON_HELP_URL,
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
export class InscricaoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inscricoesService = inject(InscricoesService);
  private readonly preconsService = inject(PreconsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();
  readonly submitted = output<void>();

  protected readonly faXmark = faXmark;
  protected readonly preconHelpUrl = PRECON_HELP_URL;
  protected readonly regrasUrl = REGRAS_URL;
  protected readonly privacidadeUrl = PRIVACIDADE_URL;
  protected readonly discordUrl = DISCORD_URL;

  protected readonly submitting = signal(false);
  protected readonly loadingPrecons = signal(true);
  protected readonly precons = signal<PreconListItem[]>([]);
  protected readonly comandantes = signal<PreconComandante[]>([]);
  protected readonly preconSearch = signal('');
  protected readonly comandanteSearch = signal('');

  protected readonly form = this.fb.nonNullable.group({
    preconId: ['', [Validators.required]],
    preconComandanteId: [{ value: '', disabled: true }, [Validators.required]],
    preconComandante2Id: [{ value: '', disabled: true }],
    aceiteTermos: [false, [requiredTrue]],
    aceitePrivacidade: [false, [requiredTrue]],
    entrouDiscord: [false, [requiredTrue]],
  });

  /** Deck de partner = 2+ comandantes elegíveis com a mecânica Partner. */
  protected readonly podePartner = computed(
    () => this.comandantes().filter((c) => c.isPartner).length >= 2,
  );

  /** Comandantes elegíveis como 2º (partner), exceto o já escolhido como 1º. */
  protected readonly comandantesParceiroDisponiveis = computed(() => {
    const primeiroId = this.comandantePrincipalId();
    return this.comandantes().filter((c) => c.isPartner && c.id !== primeiroId);
  });

  protected readonly comandantePrincipalId = signal('');

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      map(() => this.form.valid && !!this.form.controls.preconComandanteId.value),
    ),
    { initialValue: false },
  );

  protected readonly canSubmit = computed(
    () => this.formValid() && !this.submitting() && !this.loadingPrecons(),
  );

  protected readonly preconsFiltrados = computed(() => {
    const term = this.preconSearch().trim().toLowerCase();
    const list = this.precons();
    if (!term) return list;
    return list.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        p.setNome.toLowerCase().includes(term),
    );
  });

  protected readonly comandantesFiltrados = computed(() => {
    const term = this.comandanteSearch().trim().toLowerCase();
    const list = this.comandantes();
    if (!term) return list;
    return list.filter((cmd) => cmd.comandante.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.preconsService.search().subscribe({
      next: (list) => {
        this.precons.set(list);
        this.loadingPrecons.set(false);
      },
      error: () => {
        this.loadingPrecons.set(false);
        this.snackBar.open('Não foi possível carregar a lista de precons.', 'Fechar', {
          duration: 5000,
        });
      },
    });

    this.form.controls.preconId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preconId) => {
        this.preconSearch.set('');
        this.comandanteSearch.set('');
        const comandanteCtrl = this.form.controls.preconComandanteId;
        const comandante2Ctrl = this.form.controls.preconComandante2Id;
        comandanteCtrl.reset('');
        comandante2Ctrl.reset('');
        comandante2Ctrl.disable({ emitEvent: false });
        this.comandantePrincipalId.set('');
        this.comandantes.set([]);

        if (preconId) {
          comandanteCtrl.enable({ emitEvent: false });
          this.preconsService.listComandantes(preconId).subscribe({
            next: (cmds) => this.comandantes.set(cmds),
            error: () => {
              this.snackBar.open('Erro ao carregar comandantes.', 'Fechar', { duration: 4000 });
            },
          });
        } else {
          comandanteCtrl.disable({ emitEvent: false });
        }
        this.form.updateValueAndValidity({ emitEvent: true });
      });

    this.form.controls.preconComandanteId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.comandanteSearch.set('');
        this.comandantePrincipalId.set(id);

        // Habilita o 2º comandante só quando o deck é partner e há um 1º escolhido.
        const c2 = this.form.controls.preconComandante2Id;
        const primeiro = this.comandantes().find((c) => c.id === id);
        if (id && this.podePartner() && primeiro?.isPartner) {
          c2.enable({ emitEvent: false });
        } else {
          c2.reset('');
          c2.disable({ emitEvent: false });
        }
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
        preconId: raw.preconId,
        preconComandanteId: raw.preconComandanteId,
        ...(raw.preconComandante2Id ? { preconComandante2Id: raw.preconComandante2Id } : {}),
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
