import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faDice,
  faLayerGroup,
  faMagnifyingGlass,
  faTableCells,
  faTableList,
  faUserCheck,
  faUserGroup,
  faUserPlus,
  faWandSparkles,
} from '@fortawesome/free-solid-svg-icons';

import { API_URL, bannerSrc } from '../../core/config/api.config';
import { SessionService } from '../../core/auth/session.service';
import { DeckFilterOption, JogadorInscrito } from '../../core/inscricoes/inscricoes.models';
import { InscricoesService } from '../../core/inscricoes/inscricoes.service';
import { ProximaRodada, Rodada } from '../../core/rodadas/rodadas.models';
import { RodadasService } from '../../core/rodadas/rodadas.service';
import { CheckInStatus } from '../../core/sorteio/sorteio.models';
import { SorteioService } from '../../core/sorteio/sorteio.service';
import { MesasComponent } from '../mesas/mesas';
import { InscricaoFormComponent } from './inscricao-form/inscricao-form';
import { JogadorCardComponent } from './jogador-card/jogador-card';
import { PrecompeonatoTabelaComponent } from './precompeonato-tabela/precompeonato-tabela';
import { SorteioMesasComponent } from './sorteio-mesas/sorteio-mesas';

type PrecompeonatoViewMode = 'jogadores' | 'mesas' | 'tabela' | 'sorteio';

interface CampeonatoAtual {
  id: string;
  nome: string;
  edicao: string;
  dataInicio: string;
  descricao: string | null;
  bannerUrl: string | null;
  status: string;
  statusCode: string;
}

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
    InscricaoFormComponent,
    MesasComponent,
    PrecompeonatoTabelaComponent,
    SorteioMesasComponent,
  ],
  templateUrl: './precompeonato.html',
  styleUrl: './precompeonato.scss',
})
export class PrecompeonatoComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly inscricoesService = inject(InscricoesService);
  private readonly rodadasService = inject(RodadasService);
  private readonly sorteioService = inject(SorteioService);
  private readonly session = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly bannerSrc = bannerSrc;

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly faTableCells = faTableCells;
  protected readonly faTableList = faTableList;
  protected readonly faUserGroup = faUserGroup;
  protected readonly faUserPlus = faUserPlus;
  protected readonly faLayerGroup = faLayerGroup;
  protected readonly faWandSparkles = faWandSparkles;
  protected readonly faMagnifyingGlass = faMagnifyingGlass;
  protected readonly faDice = faDice;
  protected readonly faUserCheck = faUserCheck;
  protected readonly faCheck = faCheck;

  protected readonly viewMode = signal<PrecompeonatoViewMode>('jogadores');
  protected readonly loading = signal(true);
  protected readonly campeonato = signal<CampeonatoAtual | null>(null);
  protected readonly campeonatoLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly jogadores = signal<JogadorInscrito[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedDeck = signal<string | null>(null);
  protected readonly inscricaoAberta = signal(false);
  protected readonly checkInStatus = signal<CheckInStatus | null>(null);
  protected readonly checkInLoading = signal(false);

  // Timer countdown signals
  protected readonly timerTarget = signal<Date | null>(null);
  protected readonly timerLabel = signal('');
  protected readonly timerDays = signal('00');
  protected readonly timerHours = signal('00');
  protected readonly timerMinutes = signal('00');
  protected readonly timerSeconds = signal('00');

  // Rodada ativa notification
  protected readonly rodadaAtiva = signal<Rodada | null>(null);

  // Aviso de próxima rodada agendada (pode não existir)
  protected readonly proximaRodada = signal<ProximaRodada | null>(null);

  protected readonly avisoProximaRodada = computed(() => {
    const p = this.proximaRodada();
    if (!p) return null;
    if (p.diasRestantes === 0) return `A rodada ${p.numero} é hoje!`;
    if (p.diasRestantes === 1) return `A rodada ${p.numero} é amanhã.`;
    return `A rodada ${p.numero} começa em ${p.diasRestantes} dias.`;
  });

  protected readonly isAdmin = computed(() => {
    this.session.authRevision();
    return this.session.isAdmin();
  });

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

  protected readonly ctaSorteioLabel = computed(() =>
    this.viewMode() === 'sorteio' ? 'Ver Planeswalkers' : 'Sorteio de mesas',
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

  protected readonly showCheckInButton = computed(() => {
    const status = this.checkInStatus();
    return !!status?.jaInscrito && status.podeCheckIn;
  });

  ngOnInit(): void {
    this.carregarCampeonato();
    this.carregarJogadores();
    this.carregarCheckIn();
    this.carregarRodadaAtiva();
    this.carregarProximaRodada();
    this.iniciarTimerInscricoes();
  }

  private carregarProximaRodada(): void {
    this.rodadasService.getProximaRodada().subscribe({
      next: (proxima) => this.proximaRodada.set(proxima),
      error: () => this.proximaRodada.set(null),
    });
  }

  ngOnDestroy(): void {
    this.pararTimer();
  }

  protected toggleMesasView(): void {
    this.viewMode.update((mode) => (mode === 'mesas' ? 'jogadores' : 'mesas'));
  }

  protected toggleTabelaView(): void {
    this.viewMode.update((mode) => (mode === 'tabela' ? 'jogadores' : 'tabela'));
  }

  protected toggleSorteioView(): void {
    if (!this.isAdmin()) return;
    this.viewMode.update((mode) => (mode === 'sorteio' ? 'jogadores' : 'sorteio'));
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

  protected carregarCheckIn(): void {
    if (!this.session.getToken()) return;

    this.sorteioService.getCheckInStatus().subscribe({
      next: (status) => this.checkInStatus.set(status),
      error: () => this.checkInStatus.set(null),
    });
  }

  protected toggleCheckIn(): void {
    const status = this.checkInStatus();
    if (!status || !status.podeCheckIn || this.checkInLoading()) return;

    this.checkInLoading.set(true);
    const request = status.checkIn
      ? this.sorteioService.cancelCheckIn()
      : this.sorteioService.checkIn();

    request.subscribe({
      next: (next) => {
        this.checkInStatus.set(next);
        this.checkInLoading.set(false);
        this.snackBar.open(
          next.checkIn ? 'Check-in realizado!' : 'Check-in cancelado.',
          'Fechar',
          { duration: 3000 },
        );
      },
      error: (err: HttpErrorResponse) => {
        this.checkInLoading.set(false);
        const message =
          (typeof err.error?.message === 'string' && err.error.message) ||
          'Não foi possível atualizar o check-in.';
        this.snackBar.open(message, 'Fechar', { duration: 5000 });
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

  protected abrirInscricao(): void {
    if (this.campeonato()?.statusCode !== 'INSCRICOES_ABERTAS') return;
    this.inscricaoAberta.set(true);
  }

  private carregarCampeonato(): void {
    this.http.get<CampeonatoAtual>(`${API_URL}/precompeonato/atual`).subscribe({
      next: (c) => {
        this.campeonato.set(c);
        this.campeonatoLoading.set(false);
      },
      error: () => {
        this.campeonato.set(null);
        this.campeonatoLoading.set(false);
      },
    });
  }

  protected fecharInscricao(): void {
    this.inscricaoAberta.set(false);
  }

  protected onInscricaoEnviada(): void {
    this.inscricaoAberta.set(false);
    this.carregarJogadores();
    this.carregarCheckIn();
  }

  private carregarRodadaAtiva(): void {
    this.rodadasService.getRodadaAtual().subscribe({
      next: (rodada) => {
        if (rodada && rodada.ativa && !rodada.finalizada) {
          this.rodadaAtiva.set(rodada);
        } else {
          this.rodadaAtiva.set(null);
        }
      },
      error: () => this.rodadaAtiva.set(null),
    });
  }

  private iniciarTimerInscricoes(): void {
    // TODO: Quando houver campo `inscricoesAbertasAte` no campeonato, usar aqui.
    // Por enquanto, sem data de encerramento disponível, o timer não será exibido.
    // Para testar, descomente e substitua pela data real:
    // this.iniciarTimer(new Date('2025-02-15T23:59:59'), 'Inscrições encerram em:');
  }

  private iniciarTimer(target: Date, label: string): void {
    this.timerTarget.set(target);
    this.timerLabel.set(label);
    this.atualizarTimer();

    this.timerInterval = setInterval(() => this.atualizarTimer(), 1000);
  }

  private atualizarTimer(): void {
    const target = this.timerTarget();
    if (!target) return;

    const now = Date.now();
    const diff = target.getTime() - now;

    if (diff <= 0) {
      this.timerTarget.set(null);
      this.pararTimer();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timerDays.set(String(days).padStart(2, '0'));
    this.timerHours.set(String(hours).padStart(2, '0'));
    this.timerMinutes.set(String(minutes).padStart(2, '0'));
    this.timerSeconds.set(String(seconds).padStart(2, '0'));
  }

  private pararTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
