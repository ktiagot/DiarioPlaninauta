import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { JogadorInscrito } from '../../../core/inscricoes/inscricoes.models';

@Component({
  selector: 'app-precompeonato-tabela',
  imports: [FormsModule, FaIconComponent, MatFormFieldModule, MatInputModule, MatTableModule],
  templateUrl: './precompeonato-tabela.html',
  styleUrl: './precompeonato-tabela.scss',
})
export class PrecompeonatoTabelaComponent {
  readonly jogadores = input.required<JogadorInscrito[]>();

  protected readonly faMagnifyingGlass = faMagnifyingGlass;
  protected readonly searchQuery = signal('');

  protected readonly displayedColumns: string[] = [
    'posicao',
    'jogador',
    'comandante',
    'pontos',
    'eliminacoes',
  ];

  protected readonly dataSource = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const jogadores = this.jogadores();

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
