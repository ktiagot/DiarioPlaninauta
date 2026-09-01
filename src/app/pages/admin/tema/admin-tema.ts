import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { TemaService } from '../../../core/tema/tema.service';
import { Tema, TemaModo, TEMA_PADRAO } from '../../../core/tema/tema.models';

interface CampoCor {
  chave: 'primary' | 'primaryStrong' | 'onPrimary' | 'bg' | 'text';
  label: string;
  descricao: string;
}

const CAMPOS: CampoCor[] = [
  { chave: 'primary', label: 'Cor primária (destaque)', descricao: 'Botões, ícones, links, chips.' },
  { chave: 'primaryStrong', label: 'Primária forte', descricao: 'Gradientes e realces.' },
  { chave: 'onPrimary', label: 'Cor sobre a primária', descricao: 'Texto/ícone em cima de botões primários.' },
  { chave: 'bg', label: 'Fundo', descricao: 'Cor base do fundo do site.' },
  { chave: 'text', label: 'Texto', descricao: 'Texto principal (e deriva superfícies/bordas).' },
];

@Component({
  selector: 'app-admin-tema',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-tema.html',
  styleUrl: './admin-tema.scss',
})
export class AdminTemaComponent implements OnInit {
  private readonly temaService = inject(TemaService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly campos = CAMPOS;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly modo = signal<TemaModo>('PADRAO');
  protected readonly cores = signal<Omit<Tema, 'modo'>>({ ...TEMA_PADRAO });

  protected readonly personalizado = computed(() => this.modo() === 'PERSONALIZADO');

  ngOnInit(): void {
    this.temaService
      .obter()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tema) => {
          this.modo.set(tema.modo);
          this.cores.set({
            primary: tema.primary,
            primaryStrong: tema.primaryStrong,
            onPrimary: tema.onPrimary,
            bg: tema.bg,
            text: tema.text,
          });
        },
        error: () => {
          this.snackBar.open('Erro ao carregar o tema.', 'Fechar', { duration: 5000 });
        },
      });
  }

  protected setModo(modo: TemaModo): void {
    this.modo.set(modo);
    this.previaAoVivo();
  }

  protected atualizarCor(chave: CampoCor['chave'], valor: string): void {
    this.cores.update((c) => ({ ...c, [chave]: valor }));
    this.previaAoVivo();
  }

  /** Aplica na tela imediatamente (preview), sem persistir. */
  private previaAoVivo(): void {
    this.temaService.aplicar({ modo: this.modo(), ...this.cores() });
  }

  protected salvar(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const tema: Tema = { modo: this.modo(), ...this.cores() };
    this.temaService
      .atualizar(tema)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (salvo) => {
          this.temaService.aplicar(salvo);
          this.snackBar.open('Tema atualizado!', 'OK', { duration: 4000 });
        },
        error: (err) => {
          const msg =
            (typeof err?.error?.message === 'string' ? err.error.message : null) ||
            (Array.isArray(err?.error?.message) ? err.error.message.join(' ') : null) ||
            'Não foi possível salvar o tema.';
          this.snackBar.open(msg, 'Fechar', { duration: 6000 });
        },
      });
  }

  protected restaurarPadrao(): void {
    this.cores.set({
      primary: TEMA_PADRAO.primary,
      primaryStrong: TEMA_PADRAO.primaryStrong,
      onPrimary: TEMA_PADRAO.onPrimary,
      bg: TEMA_PADRAO.bg,
      text: TEMA_PADRAO.text,
    });
    this.previaAoVivo();
  }

  protected corAtual(chave: CampoCor['chave']): string {
    return this.cores()[chave];
  }
}
