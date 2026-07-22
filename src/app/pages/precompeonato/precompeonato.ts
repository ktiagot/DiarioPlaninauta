import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faLayerGroup,
  faMagnifyingGlass,
  faTableCells,
  faTableList,
  faUserGroup,
  faUserPlus,
  faWandSparkles,
} from '@fortawesome/free-solid-svg-icons';

import { DeckFilterOption, JogadorInscrito } from '../../core/inscricoes/inscricoes.models';
import { InscricoesService } from '../../core/inscricoes/inscricoes.service';
import { MesasComponent } from '../mesas/mesas';
import { JogadorCardComponent } from './jogador-card/jogador-card';
import { PrecompeonatoTabelaComponent } from './precompeonato-tabela/precompeonato-tabela';

type PrecompeonatoViewMode = 'jogadores' | 'mesas' | 'tabela';

@Component({
  selector: 'app-precompeonato',
  imports: [
    FormsModule,
    FaIconComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    JogadorCardComponent,
    MesasComponent,
    PrecompeonatoTabelaComponent,
  ],
  templateUrl: './precompeonato.html',
  styleUrl: './precompeonato.scss',
})
export class PrecompeonatoComponent implements OnInit {
  private readonly inscricoesService = inject(InscricoesService);

  protected readonly faTableCells = faTableCells;
  protected readonly faTableList = faTableList;
  protected readonly faUserGroup = faUserGroup;
  protected readonly faUserPlus = faUserPlus;
  protected readonly faLayerGroup = faLayerGroup;
  protected readonly faWandSparkles = faWandSparkles;
  protected readonly faMagnifyingGlass = faMagnifyingGlass;

  protected readonly viewMode = signal<PrecompeonatoViewMode>('jogadores');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly jogadores = signal<JogadorInscrito[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedDeck = signal<string | null>(null);

  protected readonly ctaMesasLabel = computed(() =>
    this.viewMode() === 'mesas' ? 'Ver Planeswalkers' : 'Ver Mesas da Rodada Atual',
  );

  protected readonly ctaMesasIcon = computed(() =>
    this.viewMode() === 'mesas' ? this.faUserGroup : this.faTableCells,
  );

  protected readonly ctaTabelaLabel = computed(() =>
    this.viewMode() === 'tabela' ? 'Ver Planeswalkers' : 'Ver tabela',
  );

  protected readonly ctaTabelaIcon = computed(() =>
    this.viewMode() === 'tabela' ? this.faUserGroup : this.faTableList,
  );

  protected readonly deckFilterOptions = computed<DeckFilterOption[]>(() => {
    const counts = new Map<string, number>();

    for (const j of this.jogadores()) {
      if (!j.deckNome) continue;
      counts.set(j.deckNome, (counts.get(j.deckNome) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome));
  });

  protected readonly filteredJogadores = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const deck = this.selectedDeck();
    let result = this.jogadores();

    if (deck) {
      result = result.filter((j) => j.deckNome === deck);
    }

    if (query) {
      result = result.filter((j) => {
        const haystack = [j.nome, j.nickname, j.comandante, j.deckNome]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    return result;
  });

  protected readonly totalJogadores = computed(() => this.jogadores().length);

  protected readonly totalDecksUnicos = computed(() => this.deckFilterOptions().length);

  protected readonly totalCommanders = computed(() => {
    const commanders = new Set(
      this.jogadores()
        .map((j) => j.comandante?.trim().toLowerCase())
        .filter((c): c is string => !!c),
    );
    return commanders.size;
  });

  ngOnInit(): void {
    this.carregarJogadores();
  }

  protected toggleMesasView(): void {
    this.viewMode.update((mode) => (mode === 'mesas' ? 'jogadores' : 'mesas'));
  }

  protected toggleTabelaView(): void {
    this.viewMode.update((mode) => (mode === 'tabela' ? 'jogadores' : 'tabela'));
  }

  protected carregarJogadores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inscricoesService.getJogadoresInscritos().subscribe({
      next: (jogadores) => {
        this.jogadores.set(jogadores);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Erro ao carregar jogadores.');
        this.loading.set(false);
      },
    });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected selecionarDeck(deck: string | null): void {
    this.selectedDeck.set(deck);
  }

  protected isDeckAtivo(deck: string | null): boolean {
    return this.selectedDeck() === deck;
  }
}
