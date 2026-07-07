import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCalendarDays,
  faClock,
  faLayerGroup,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';

import { User } from '../../core/users/users.models';
import { UsersService } from '../../core/users/users.service';
import { PROFILE_PROMOS } from './perfil.constants';

@Component({
  selector: 'app-perfil',
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
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class PerfilComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly faLocationDot = faLocationDot;
  protected readonly faCalendarDays = faCalendarDays;
  protected readonly faClock = faClock;
  protected readonly faLayerGroup = faLayerGroup;
  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  protected readonly loading = signal(true);
  protected readonly profile = signal<User | null>(null);
  protected readonly isAuthenticated = signal(!!localStorage.getItem('access_token'));
  protected readonly promos = PROFILE_PROMOS;

  protected readonly displayNick = computed(() => this.profile()?.nick ?? '—');
  protected readonly displayPronome = computed(() => this.profile()?.genero ?? '');
  protected readonly displayNome = computed(() => {
    const user = this.profile();
    if (!user) return '—';
    const fullName = [user.nome, user.sobrenome].filter(Boolean).join(' ');
    return fullName || '—';
  });
  protected readonly displayTelefone = computed(() =>
    formatTelefone(this.profile()?.telefone),
  );
  protected readonly displayFormatos = computed(() => this.profile()?.formatos ?? []);
  protected readonly displayCidade = computed(() => this.profile()?.cidade ?? '—');
  protected readonly displayColecaoFavorita = computed(
    () => this.profile()?.formatoFavorito ?? '—',
  );
  protected readonly displayDias = computed(() => joinList(this.profile()?.diasDisponiveis));
  protected readonly displayHorarios = computed(() => joinList(this.profile()?.horarios));
  protected readonly displayPreCampeonatos = computed(
    () => this.profile()?.preCampeonatos ?? [],
  );
  protected readonly displayDecks = computed(() => this.profile()?.decksMaisUsados ?? []);
  protected readonly displayMelhoresResultados = computed(() =>
    formatMelhoresResultados(this.profile()?.melhoresResultados ?? []),
  );
  protected readonly mesesApoiando = computed(() => {
    const createdAt = this.profile()?.createdAt;
    return createdAt ? calcMesesApoiando(createdAt) : null;
  });
  protected readonly avatarInitial = computed(() => {
    const user = this.profile();
    const source = user?.nick ?? user?.nome ?? user?.email ?? '?';
    return source.charAt(0).toUpperCase();
  });
  protected readonly avatarUrl = computed(() => this.profile()?.foto ?? null);
  protected readonly badgeLabel = computed(() => this.profile()?.badge ?? null);

  ngOnInit(): void {
    const userId = localStorage.getItem('user_id');

    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.usersService.findById(userId).subscribe({
      next: (user) => {
        this.profile.set(user);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message =
          err.status === 404
            ? 'Perfil não encontrado.'
            : 'Não foi possível carregar seu perfil.';
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }

  protected openPromoLink(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

function joinList(values: string[] | undefined): string {
  if (!values?.length) return '—';
  return values.join(' / ');
}

function formatTelefone(telefone: string | null | undefined): string {
  if (!telefone) return '—';

  const digits = telefone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}.${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}.${digits.slice(6)}`;
  }

  return telefone;
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
