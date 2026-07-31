import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendarDays,
  faClock,
  faHeart,
  faLayerGroup,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';

import { UserPublic } from '../../core/users/user-public.models';
import { UsersService } from '../../core/users/users.service';
import { ComunidadeService } from '../../core/comunidade/comunidade.service';
import { ContatoResponse } from '../../core/comunidade/comunidade.models';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FaIconComponent,
  ],
  templateUrl: './perfil-publico.html',
  styleUrl: './perfil-publico.scss',
})
export class PerfilPublicoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usersService = inject(UsersService);
  private readonly comunidadeService = inject(ComunidadeService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly faLocationDot = faLocationDot;
  protected readonly faCalendarDays = faCalendarDays;
  protected readonly faClock = faClock;
  protected readonly faLayerGroup = faLayerGroup;
  protected readonly faHeart = faHeart;
  protected readonly faHeartOutline = faHeartOutline;

  protected readonly loading = signal(true);
  protected readonly profile = signal<UserPublic | null>(null);
  protected readonly isFavorito = signal(false);
  protected readonly contato = signal<ContatoResponse | null>(null);
  protected readonly loadingContato = signal(false);

  protected readonly displayNick = computed(() => this.profile()?.nick ?? '—');
  protected readonly displayNome = computed(() => this.profile()?.nome ?? '—');
  protected readonly displayGenero = computed(() => this.profile()?.genero ?? '');
  protected readonly displayFormatos = computed(() => this.profile()?.formatos ?? []);
  protected readonly displayCidade = computed(() => {
    const p = this.profile();
    if (!p) return '—';
    return [p.cidade, p.estado].filter(Boolean).join(' — ');
  });
  protected readonly displayColecaoFavorita = computed(
    () => this.profile()?.formatoFavorito ?? '—',
  );
  protected readonly displayDias = computed(() => joinList(this.profile()?.diasDisponiveis));
  protected readonly displayHorarios = computed(() => joinList(this.profile()?.horarios));
  protected readonly displayDecks = computed(() => this.profile()?.decksMaisUsados ?? []);
  protected readonly displayPreCampeonatos = computed(
    () => this.profile()?.preCampeonatos ?? [],
  );
  protected readonly displayMelhoresResultados = computed(() =>
    formatMelhoresResultados(this.profile()?.melhoresResultados ?? []),
  );
  protected readonly mesesApoiando = computed(() => {
    const apoiandoDesde = this.profile()?.apoiandoDesde;
    return apoiandoDesde ? calcMesesApoiando(apoiandoDesde) : null;
  });
  protected readonly avatarInitial = computed(() => {
    const user = this.profile();
    const source = user?.nick ?? user?.nome ?? '?';
    return source.charAt(0).toUpperCase();
  });
  protected readonly avatarUrl = computed(() => this.profile()?.foto ?? null);
  protected readonly badgeLabel = computed(() => this.profile()?.badge ?? null);

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId') ?? '';

    if (!this.userId) {
      this.loading.set(false);
      return;
    }

    this.usersService.findByIdPublic(this.userId).subscribe({
      next: (user) => {
        this.profile.set(user);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message =
          err.status === 404
            ? 'Jogador não encontrado.'
            : 'Não foi possível carregar o perfil.';
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });

    this.comunidadeService.listarFavoritos().subscribe({
      next: (favoritos) => {
        this.isFavorito.set(favoritos.includes(this.userId));
      },
      error: () => {},
    });
  }

  protected toggleFavorito(): void {
    if (this.isFavorito()) {
      this.comunidadeService.desfavoritar(this.userId).subscribe({
        next: () => {
          this.isFavorito.set(false);
          this.contato.set(null);
          this.snackBar.open('Removido dos favoritos', 'OK', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Erro ao desfavoritar', 'OK', { duration: 3000 });
        },
      });
    } else {
      this.comunidadeService.favoritar(this.userId).subscribe({
        next: () => {
          this.isFavorito.set(true);
          this.snackBar.open('Adicionado aos favoritos ❤️', 'OK', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Erro ao favoritar', 'OK', { duration: 3000 });
        },
      });
    }
  }

  protected verContato(): void {
    this.loadingContato.set(true);
    this.comunidadeService.obterContato(this.userId).subscribe({
      next: (contato) => {
        this.contato.set(contato);
        this.loadingContato.set(false);
        if (!contato.mutuo) {
          this.snackBar.open(
            'O jogador ainda não te favoritou de volta. Contato indisponível.',
            'OK',
            { duration: 5000 },
          );
        }
      },
      error: () => {
        this.loadingContato.set(false);
        this.snackBar.open('Não foi possível obter o contato.', 'OK', { duration: 4000 });
      },
    });
  }
}

function joinList(values: string[] | undefined): string {
  if (!values?.length) return '—';
  return values.join(' / ');
}

function calcMesesApoiando(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const months =
    (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  return Math.max(1, months);
}

function formatMelhoresResultados(resultados: number[]): string[] {
  if (!resultados.length) return [];
  return resultados.map((posicao) => {
    if (posicao === 1) return '1º Lugar';
    if (posicao === 2) return '2º Lugar';
    if (posicao === 3) return '3º Lugar';
    if (posicao === 4) return 'Top 4';
    return `${posicao}º Lugar`;
  });
}
