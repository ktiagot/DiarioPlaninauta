import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ComunidadeService } from '../../core/comunidade/comunidade.service';
import { JogadorComunidade, ContatoResponse } from '../../core/comunidade/comunidade.models';
import { MesasService } from '../../core/mesas/mesas.service';
import { Mesa } from '../../core/mesas/mesas.models';
import { SessionService } from '../../core/auth/session.service';

@Component({
  selector: 'app-comunidade',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './comunidade.html',
  styleUrl: './comunidade.scss',
})
export class ComunidadeComponent implements OnInit {
  private readonly comunidadeService = inject(ComunidadeService);
  private readonly mesasService = inject(MesasService);
  private readonly session = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly buscaSubject = new Subject<string>();

  private readonly meuUserId = this.session.getUserId();

  protected readonly MAX_JOGADORES = 4;

  /** Minhas mesas que ainda podem receber convidados (abertas e não cheias). */
  readonly minhasMesasConvidaveis = signal<Mesa[]>([]);
  readonly convidandoId = signal<string | null>(null);

  readonly loading = signal(true);
  readonly jogadores = signal<JogadorComunidade[]>([]);
  readonly favoritos = signal<Set<string>>(new Set());
  readonly termoBusca = signal('');
  readonly filtroCidade = signal('');
  readonly filtroFormato = signal('');
  readonly filtroDisponibilidade = signal('');
  readonly soFavoritos = signal(false);

  readonly cidadesDisponiveis = computed(() => {
    const cidades = this.jogadores().map((j) => j.cidade).filter(Boolean);
    return [...new Set(cidades)].sort();
  });

  readonly formatosDisponiveis = computed(() => {
    const formatos = this.jogadores().flatMap((j) => j.formatos);
    return [...new Set(formatos)].sort();
  });

  readonly diasDisponiveis = computed(() => {
    const dias = this.jogadores().flatMap((j) => j.diasDisponiveis);
    return [...new Set(dias)].sort();
  });

  readonly jogadoresFiltrados = computed(() => {
    // Não faz sentido aparecer a si mesmo na comunidade (favoritar/convidar).
    let lista = this.jogadores().filter((j) => j.id !== this.meuUserId);
    const cidade = this.filtroCidade();
    const formato = this.filtroFormato();
    const disponibilidade = this.filtroDisponibilidade();
    const favs = this.favoritos();

    if (this.soFavoritos()) {
      lista = lista.filter((j) => favs.has(j.id));
    }
    if (cidade) {
      lista = lista.filter((j) => j.cidade.toLowerCase() === cidade.toLowerCase());
    }
    if (formato) {
      lista = lista.filter((j) => j.formatos.includes(formato));
    }
    if (disponibilidade) {
      lista = lista.filter((j) => j.diasDisponiveis.includes(disponibilidade));
    }

    return lista;
  });

  toggleSoFavoritos(): void {
    this.soFavoritos.update((v) => !v);
  }

  ngOnInit(): void {
    this.carregarDados();

    this.buscaSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((termo) => {
        this.termoBusca.set(termo);
        this.buscar();
      });
  }

  onBuscaInput(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.buscaSubject.next(valor);
  }

  buscar(): void {
    this.loading.set(true);
    this.comunidadeService
      .listarJogadores({ busca: this.termoBusca() })
      .subscribe({
        next: (jogadores) => {
          this.jogadores.set(jogadores);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Erro ao buscar jogadores.', 'OK', { duration: 3000 });
          this.loading.set(false);
        },
      });
  }

  toggleFavorito(userId: string): void {
    const atual = this.favoritos();
    if (atual.has(userId)) {
      this.comunidadeService.desfavoritar(userId).subscribe({
        next: () => {
          const novo = new Set(atual);
          novo.delete(userId);
          this.favoritos.set(novo);
        },
        error: () => this.snackBar.open('Erro ao desfavoritar.', 'OK', { duration: 3000 }),
      });
    } else {
      this.comunidadeService.favoritar(userId).subscribe({
        next: () => {
          const novo = new Set(atual);
          novo.add(userId);
          this.favoritos.set(novo);
        },
        error: () => this.snackBar.open('Erro ao favoritar.', 'OK', { duration: 3000 }),
      });
    }
  }

  verContato(userId: string): void {
    this.comunidadeService.obterContato(userId).subscribe({
      next: (contato: ContatoResponse) => {
        if (!contato.mutuo) {
          this.snackBar.open(
            'Vocês precisam se favoritar mutuamente para ver o contato.',
            'OK',
            { duration: 4000 },
          );
          return;
        }
        const msg = contato.telefone
          ? `📞 ${contato.telefone}${contato.discord ? ' | Discord: ' + contato.discord : ''}`
          : 'Contato não disponível.';
        this.snackBar.open(msg, 'OK', { duration: 8000 });
      },
      error: () => this.snackBar.open('Erro ao obter contato.', 'OK', { duration: 3000 }),
    });
  }

  isFavorito(userId: string): boolean {
    return this.favoritos().has(userId);
  }

  calcularMesesApoio(apoiandoDesde: string | null | undefined): number {
    if (!apoiandoDesde) return 0;
    const inicio = new Date(apoiandoDesde);
    const agora = new Date();
    const diffMs = agora.getTime() - inicio.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
  }

  getIniciais(nome: string): string {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  private carregarDados(): void {
    this.comunidadeService.listarJogadores().subscribe({
      next: (jogadores) => {
        this.jogadores.set(jogadores);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar comunidade.', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });

    this.comunidadeService.listarFavoritos().subscribe({
      next: (ids) => this.favoritos.set(new Set(ids)),
      error: () => {},
    });

    this.carregarMinhasMesasConvidaveis();
  }

  private carregarMinhasMesasConvidaveis(): void {
    this.mesasService.minhas().subscribe({
      next: (mesas) => {
        const convidaveis = mesas.filter(
          (m) => !m.finalizada && m.quantidadeJogadores < this.MAX_JOGADORES,
        );
        this.minhasMesasConvidaveis.set(convidaveis);
      },
      error: () => this.minhasMesasConvidaveis.set([]),
    });
  }

  convidar(userId: string, mesaId: string): void {
    this.convidandoId.set(userId);
    this.mesasService.convidar(mesaId, userId).subscribe({
      next: () => {
        this.convidandoId.set(null);
        this.snackBar.open('Convite enviado!', 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.convidandoId.set(null);
        const msg =
          (typeof err?.error?.message === 'string' ? err.error.message : null) ||
          'Não foi possível enviar o convite.';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
      },
    });
  }
}
