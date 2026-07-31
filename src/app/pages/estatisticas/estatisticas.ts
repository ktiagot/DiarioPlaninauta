import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { EstatisticasService } from '../../core/estatisticas/estatisticas.service';
import { SessionService } from '../../core/auth/session.service';
import {
  EstatisticasGerais,
  MetagameDeck,
  MinhasEstatisticas,
  TopKiller,
} from '../../core/estatisticas/estatisticas.models';

@Component({
  selector: 'app-estatisticas',
  imports: [
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './estatisticas.html',
  styleUrl: './estatisticas.scss',
})
export class EstatisticasComponent implements OnInit {
  private readonly estatisticasService = inject(EstatisticasService);
  private readonly session = inject(SessionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly gerais = signal<EstatisticasGerais | null>(null);
  readonly metagame = signal<MetagameDeck[]>([]);
  readonly topKillers = signal<TopKiller[]>([]);
  readonly minhas = signal<MinhasEstatisticas | null>(null);

  readonly isLoggedIn = computed(() => this.session.isAuthenticated());
  readonly maxKills = computed(() => {
    const killers = this.topKillers();
    return killers.length > 0 ? killers[0].totalKills : 1;
  });

  encodeURIComponent = encodeURIComponent;

  ngOnInit(): void {
    const userId = this.session.getUserId() ?? undefined;
    this.estatisticasService.getEstatisticas(userId).subscribe({
      next: (data) => {
        this.gerais.set(data.gerais);
        this.metagame.set(data.metagame);
        this.topKillers.set(data.topKillers);
        this.minhas.set(data.minhas ?? null);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
