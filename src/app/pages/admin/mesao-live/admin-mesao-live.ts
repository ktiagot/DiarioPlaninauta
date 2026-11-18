import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MesaoInscricaoAdmin, MesaoSessao } from '../../../core/mesao-live/mesao-live.models';
import { MesaoLiveService } from '../../../core/mesao-live/mesao-live.service';
import {
  formatarDataHora,
  inputLocalParaIso,
  isoParaInputLocal,
  mensagemErro,
} from '../../../core/util/data-hora';

@Component({
  selector: 'app-admin-mesao-live',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-mesao-live.html',
  styleUrl: '../analises/admin-analises.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMesaoLiveComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MesaoLiveService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly formatarDataHora = formatarDataHora;
  protected readonly loading = signal(true);
  protected readonly salvando = signal(false);
  protected readonly sessoes = signal<MesaoSessao[]>([]);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly detalheId = signal<string | null>(null);
  protected readonly inscricoes = signal<MesaoInscricaoAdmin[]>([]);
  protected readonly loadingInscricoes = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    dataHora: ['', Validators.required],
    titulo: [''],
    bracket: [''],
    vagasJogador: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    vagasSuplente: [3, [Validators.required, Validators.min(0), Validators.max(10)]],
    observacoes: [''],
    aberta: [true],
  });

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.service.listarAdmin().subscribe({
      next: (l) => {
        this.sessoes.set(l);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.erro(err, 'Erro ao carregar as datas.');
      },
    });
  }

  private erro(err: unknown, fallback: string): void {
    this.snackBar.open(mensagemErro(err, fallback), 'OK', { duration: 5000 });
  }

  protected editar(s: MesaoSessao): void {
    this.editandoId.set(s.id);
    this.form.setValue({
      dataHora: isoParaInputLocal(s.dataHora),
      titulo: s.titulo ?? '',
      bracket: s.bracket ?? '',
      vagasJogador: s.vagasJogador,
      vagasSuplente: s.vagasSuplente,
      observacoes: s.observacoes ?? '',
      aberta: s.aberta,
    });
  }

  protected cancelarEdicao(): void {
    this.editandoId.set(null);
    this.form.reset({
      dataHora: '',
      titulo: '',
      bracket: '',
      vagasJogador: 3,
      vagasSuplente: 3,
      observacoes: '',
      aberta: true,
    });
  }

  protected salvar(): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      dataHora: inputLocalParaIso(raw.dataHora),
      titulo: raw.titulo.trim(),
      bracket: raw.bracket.trim(),
      vagasJogador: raw.vagasJogador,
      vagasSuplente: raw.vagasSuplente,
      observacoes: raw.observacoes.trim(),
      aberta: raw.aberta,
    };
    const id = this.editandoId();
    this.salvando.set(true);
    (id ? this.service.atualizar(id, payload) : this.service.criar(payload)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.snackBar.open(id ? 'Data atualizada.' : 'Data criada.', 'OK', { duration: 3000 });
        this.cancelarEdicao();
        this.carregar();
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erro(err, 'Não foi possível salvar.');
      },
    });
  }

  protected remover(s: MesaoSessao): void {
    if (!confirm('Remover esta data e todas as inscrições?')) return;
    this.service.remover(s.id).subscribe({
      next: () => {
        if (this.detalheId() === s.id) this.detalheId.set(null);
        this.carregar();
      },
      error: (err: unknown) => this.erro(err, 'Erro ao remover.'),
    });
  }

  protected abrirDetalhe(id: string, forcar = false): void {
    if (!forcar && this.detalheId() === id) {
      this.detalheId.set(null);
      return;
    }
    this.detalheId.set(id);
    this.loadingInscricoes.set(true);
    this.service.listarInscricoes(id).subscribe({
      next: (l) => {
        this.inscricoes.set(l);
        this.loadingInscricoes.set(false);
      },
      error: (err: unknown) => {
        this.loadingInscricoes.set(false);
        this.erro(err, 'Erro ao carregar inscrições.');
      },
    });
  }

  protected removerInscricao(i: MesaoInscricaoAdmin): void {
    if (!confirm(`Remover a inscrição de ${i.nick}?`)) return;
    this.service.removerInscricao(i.id).subscribe({
      next: () => {
        this.carregar();
        const id = this.detalheId();
        if (id) this.abrirDetalhe(id, true);
      },
      error: (err: unknown) => this.erro(err, 'Erro ao remover inscrição.'),
    });
  }
}
