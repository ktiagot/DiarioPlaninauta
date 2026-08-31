import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { JogadorInscrito } from '../../../core/inscricoes/inscricoes.models';
import { CampeonatoOpcao, RankingService } from '../../../core/ranking/ranking.service';

// Valores especiais do seletor de campeonato.
const FILTRO_ATUAL = 'atual';
const FILTRO_GERAL = 'geral';

@Component({
  selector: 'app-precompeonato-tabela',
  imports: [
    FormsModule,
    FaIconComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './precompeonato-tabela.html',
  styleUrl: './precompeonato-tabela.scss',
})
export class PrecompeonatoTabelaComponent implements OnInit {
  readonly jogadores = input.required<JogadorInscrito[]>();

  private readonly rankingService = inject(RankingService);

  protected readonly faMagnifyingGlass = faMagnifyingGlass;
  protected readonly searchQuery = signal('');

  protected readonly FILTRO_ATUAL = FILTRO_ATUAL;
  protected readonly FILTRO_GERAL = FILTRO_GERAL;
  protected readonly filtroCampeonato = signal<string>(FILTRO_ATUAL);
  protected readonly campeonatos = signal<CampeonatoOpcao[]>([]);
  protected readonly carregandoRanking = signal(false);
  // Jogadores carregados de outro campeonato / geral (null = usar input do pai).
  private readonly jogadoresFiltrados = signal<JogadorInscrito[] | null>(null);

  ngOnInit(): void {
    this.rankingService.listarCampeonatos().subscribe({
      next: (lista) => this.campeonatos.set(lista),
      error: () => this.campeonatos.set([]),
    });
  }

  protected onFiltroChange(valor: string): void {
    this.filtroCampeonato.set(valor);

    if (valor === FILTRO_ATUAL) {
      this.jogadoresFiltrados.set(null); // volta a usar o input do pai
      return;
    }

    this.carregandoRanking.set(true);
    const campeonatoId = valor === FILTRO_GERAL ? undefined : valor;
    this.rankingService.buscarRanking(campeonatoId).subscribe({
      next: (lista) => {
        this.jogadoresFiltrados.set(lista);
        this.carregandoRanking.set(false);
      },
      error: () => {
        this.jogadoresFiltrados.set([]);
        this.carregandoRanking.set(false);
      },
    });
  }

  private readonly jogadoresBase = computed(
    () => this.jogadoresFiltrados() ?? this.jogadores(),
  );

  protected readonly displayedColumns: string[] = [
    'posicao',
    'jogador',
    'comandante',
    'pontos',
    'eliminacoes',
  ];

  protected readonly dataSource = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const jogadores = this.jogadoresBase();

    if (!query) return jogadores;

    return jogadores.filter((j) => this.matchesSearch(j, query));
  });

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected displayNome(jogador: JogadorInscrito): string {
    return jogador.nickname ? `${jogador.nome} (${jogador.nickname})` : jogador.nome;
  }

  protected rowHighlightClass(jogador: JogadorInscrito): string {
    if (jogador.ranking === 1) return 'precompeonato-tabela__row--primeiro';
    if (jogador.ranking >= 2 && jogador.ranking <= 13) {
      return 'precompeonato-tabela__row--secundario';
    }
    return '';
  }

  private matchesSearch(jogador: JogadorInscrito, query: string): boolean {
    const haystack = [
      String(jogador.ranking),
      `#${jogador.ranking}`,
      jogador.nome,
      jogador.nickname,
      this.displayNome(jogador),
      jogador.comandante,
      String(jogador.pontos),
      String(jogador.eliminacoes),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  }
}
