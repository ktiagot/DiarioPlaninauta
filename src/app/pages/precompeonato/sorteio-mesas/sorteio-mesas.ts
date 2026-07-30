import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDice, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { SorteioService } from '../../../core/sorteio/sorteio.service';
import { SorteioJogador, SorteioMesa, SorteioSnapshot } from '../../../core/sorteio/sorteio.models';

@Component({
  selector: 'app-sorteio-mesas',
  imports: [
    FormsModule,
    FaIconComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './sorteio-mesas.html',
  styleUrl: './sorteio-mesas.scss',
})
export class SorteioMesasComponent implements OnInit {
  private readonly sorteioService = inject(SorteioService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly faDice = faDice;
  protected readonly faMagnifyingGlass = faMagnifyingGlass;

  protected readonly loading = signal(true);
  protected readonly sorteando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly snapshot = signal<SorteioSnapshot | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly displayedColumns = [
    'posicao',
    'jogador',
    'comandante',
    'pontos',
    'eliminacoes',
    'checkIn',
  ];

  protected readonly dataSource = computed(() => {
    const jogadores = this.snapshot()?.jogadores ?? [];
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return jogadores;
    return jogadores.filter((j) => this.matchesSearch(j, query));
  });

  protected readonly mesas = computed<SorteioMesa[]>(() => this.snapshot()?.mesas ?? []);

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.sorteioService.getSnapshot().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.errorMessage(err, 'Erro ao carregar sorteio.'));
        this.loading.set(false);
      },
    });
  }

  protected sortear(): void {
    if (this.sorteando()) return;
    this.sorteando.set(true);
    this.sorteioService.sortearMesas().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.sorteando.set(false);
        this.snackBar.open('Mesas sorteadas com sucesso!', 'Fechar', { duration: 4000 });
      },
      error: (err: HttpErrorResponse) => {
        this.sorteando.set(false);
        this.snackBar.open(this.errorMessage(err, 'Não foi possível sortear as mesas.'), 'Fechar', {
          duration: 6000,
        });
      },
    });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected displayNome(j: SorteioJogador): string {
    return j.nick ? `${j.nomeJogador} (${j.nick})` : j.nomeJogador;
  }

  protected displayMesaNome(j: { nomeJogador: string; nick: string }): string {
    return j.nick ? `${j.nomeJogador} (${j.nick})` : j.nomeJogador;
  }

  protected rowHighlightClass(j: SorteioJogador): string {
    const pos = j.posicao ?? 0;
    if (pos === 1) return 'sorteio-tabela__row--primeiro';
    if (pos >= 2 && pos <= 13) return 'sorteio-tabela__row--secundario';
    return '';
  }

  private matchesSearch(j: SorteioJogador, query: string): boolean {
    const haystack = [
      String(j.posicao ?? ''),
      j.nomeJogador,
      j.nick,
      j.discordNick,
      j.comandante,
      String(j.pontos),
      String(j.eliminacoes),
      j.checkIn ? 'checkin sim' : 'checkin nao',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  }

  private errorMessage(err: HttpErrorResponse, fallback: string): string {
    if (typeof err.error?.message === 'string') return err.error.message;
    if (Array.isArray(err.error?.message)) return err.error.message[0];
    return fallback;
  }
}
