import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AnaliseSessao } from '../../core/analises/analises.models';
import { AnalisesService } from '../../core/analises/analises.service';
import { formatarDataHora, mensagemErro } from '../../core/util/data-hora';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-analises',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './analises.html',
  styleUrl: './analises.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalisesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AnalisesService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly formatarDataHora = formatarDataHora;
  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly sessoes = signal<AnaliseSessao[]>([]);
  protected readonly formAbertoId = signal<string | null>(null);
  protected readonly salvando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    commander: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    linkDeck: ['', [Validators.required, Validators.pattern(/^https?:\/\/\S+$/i)]],
    bracket: [''],
    budget: ['', [Validators.required, Validators.maxLength(100)]],
    objetivos: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.service.listar().subscribe({
      next: (lista) => {
        this.sessoes.set(lista);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemErro(err, 'Não foi possível carregar as datas.'));
        this.loading.set(false);
      },
    });
  }

  protected abrirForm(s: AnaliseSessao): void {
    const m = s.minhaInscricao;
    this.form.reset({
      commander: m?.commander ?? '',
      linkDeck: m?.linkDeck ?? '',
      bracket: m?.bracket ?? '',
      budget: m?.budget ?? '',
      objetivos: m?.objetivos ?? '',
    });
    this.formAbertoId.set(s.id);
  }

  protected fecharForm(): void {
    this.formAbertoId.set(null);
  }

  protected salvar(s: AnaliseSessao): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = { ...raw, bracket: raw.bracket.trim() || undefined };
    const editando = !!s.minhaInscricao;
    this.salvando.set(true);

    const req = editando
      ? this.service.atualizarMinha(s.id, payload)
      : this.service.inscrever(s.id, payload);

    req.subscribe({
      next: (atualizada) => {
        this.substituir(atualizada);
        this.salvando.set(false);
        this.fecharForm();
        const espera = atualizada.minhaInscricao?.listaEspera;
        this.snackBar.open(
          editando
            ? 'Inscrição atualizada.'
            : espera
              ? 'Vagas esgotadas: você entrou na lista de espera.'
              : 'Inscrição confirmada!',
          'OK',
          { duration: 4000 },
        );
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.snackBar.open(mensagemErro(err, 'Não foi possível salvar.'), 'OK', { duration: 5000 });
      },
    });
  }

  protected cancelar(s: AnaliseSessao): void {
    if (!confirm('Cancelar sua inscrição nesta data?')) return;
    this.service.cancelar(s.id).subscribe({
      next: () => {
        this.snackBar.open('Inscrição cancelada.', 'OK', { duration: 3000 });
        this.carregar();
      },
      error: (err: unknown) =>
        this.snackBar.open(mensagemErro(err, 'Não foi possível cancelar.'), 'OK', { duration: 5000 }),
    });
  }

  private substituir(nova: AnaliseSessao): void {
    this.sessoes.update((l) => l.map((s) => (s.id === nova.id ? nova : s)));
  }
}
