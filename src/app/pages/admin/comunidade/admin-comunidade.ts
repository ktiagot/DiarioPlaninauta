import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import '../../../core/config/chart.config';

import { API_URL } from '../../../core/config/api.config';
import { AdminService } from '../../../core/admin/admin.service';
import { JogadorAdmin, VerificarApoiaResponse } from '../../../core/admin/admin.models';

interface ComunidadeMetricas {
  totalMembros: number;
  apoiadoresAtivos: number;
  exApoiadores: number;
  totalFavoritos: number;
  topCidades: { cidade: string; quantidade: number }[];
  topFormatos: { formato: string; quantidade: number }[];
}

type VerifyUiState = 'idle' | 'verifying' | 'ativo' | 'inativo' | 'exApoiador' | 'apiIndisponivel';

@Component({
  selector: 'app-admin-comunidade',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './admin-comunidade.html',
  styleUrl: './admin-comunidade.scss',
})
export class AdminComunidadeComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly metricas = signal<ComunidadeMetricas | null>(null);

  readonly jogadoresLoading = signal(true);
  readonly jogadores = signal<JogadorAdmin[]>([]);
  readonly verifyState = signal<Record<string, VerifyUiState>>({});
  readonly verifyingEmail = signal<string | null>(null);
  readonly verifyingTodos = signal(false);
  readonly verifyTodosProgress = signal('');

  readonly cidadesChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly formatosChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  readonly jogadoresAtivosCount = computed(
    () => this.jogadores().filter((j) => j.isApoiadorAtivo).length,
  );

  readonly cidadesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, beginAtZero: true },
      y: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
    },
  };

  readonly formatosChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#ccc', padding: 12 },
      },
    },
  };

  ngOnInit(): void {
    this.http.get<ComunidadeMetricas>(`${API_URL}/comunidade/metricas`).subscribe({
      next: (data) => {
        this.metricas.set(data);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.carregarJogadores();
  }

  carregarJogadores(): void {
    this.jogadoresLoading.set(true);
    this.adminService.listJogadoresAdmin().subscribe({
      next: (data) => {
        this.jogadores.set(data);
        this.jogadoresLoading.set(false);
      },
      error: () => this.jogadoresLoading.set(false),
    });
  }

  statusLabel(jogador: JogadorAdmin): string {
    const override = this.verifyState()[jogador.email];
    if (override === 'verifying') return 'Verificando...';
    if (override === 'ativo') return 'Apoiador ativo';
    if (override === 'inativo') return 'Inativo';
    if (override === 'exApoiador') return 'Ex-apoiador';
    if (override === 'apiIndisponivel') return 'API indisponível';

    if (jogador.isApoiadorAtivo) return 'Apoiador ativo';
    if (jogador.isExApoiador) return 'Ex-apoiador';
    return 'Inativo';
  }

  statusClass(jogador: JogadorAdmin): string {
    const override = this.verifyState()[jogador.email];
    if (override === 'verifying') return 'badge badge--active';
    if (override === 'ativo') return 'badge badge--done';
    if (override === 'inativo') return 'badge badge--warn';
    if (override === 'exApoiador') return 'badge badge--inativo';
    if (override === 'apiIndisponivel') return 'badge badge--api';

    if (jogador.isApoiadorAtivo) return 'badge badge--done';
    if (jogador.isExApoiador) return 'badge badge--inativo';
    return 'badge badge--warn';
  }

  formatLastValidation(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR');
  }

  verificarUm(jogador: JogadorAdmin): void {
    if (this.verifyingTodos() || this.verifyingEmail() === jogador.email) return;

    this.verifyingEmail.set(jogador.email);
    this.setVerifyState(jogador.email, 'verifying');

    this.adminService.verificarApoia(jogador.email).subscribe({
      next: (result) => {
        this.applyVerifyResult(jogador.email, result);
        this.verifyingEmail.set(null);
        this.carregarJogadores();
      },
      error: () => {
        this.setVerifyState(jogador.email, 'apiIndisponivel');
        this.verifyingEmail.set(null);
      },
    });
  }

  async verificarTodos(): Promise<void> {
    const lista = this.jogadores();
    if (lista.length === 0 || this.verifyingTodos()) return;

    this.verifyingTodos.set(true);
    this.verifyState.set({});

    for (let i = 0; i < lista.length; i++) {
      const jogador = lista[i];
      this.verifyTodosProgress.set(`Verificando... ${i + 1}/${lista.length}`);
      this.setVerifyState(jogador.email, 'verifying');

      await new Promise<void>((resolve) => {
        this.adminService.verificarApoia(jogador.email).subscribe({
          next: (result) => {
            this.applyVerifyResult(jogador.email, result);
            resolve();
          },
          error: () => {
            this.setVerifyState(jogador.email, 'apiIndisponivel');
            resolve();
          },
        });
      });

      if (i < lista.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    this.verifyTodosProgress.set('Verificação concluída');
    this.verifyingTodos.set(false);
    this.carregarJogadores();
  }

  private applyVerifyResult(email: string, result: VerificarApoiaResponse): void {
    if (result.apiIndisponivel) {
      this.setVerifyState(email, 'apiIndisponivel');
      return;
    }
    if (result.ativo) {
      this.setVerifyState(email, 'ativo');
      return;
    }
    if (!result.isBacker) {
      this.setVerifyState(email, 'exApoiador');
      return;
    }
    this.setVerifyState(email, 'inativo');
  }

  private setVerifyState(email: string, state: VerifyUiState): void {
    this.verifyState.update((current) => ({ ...current, [email]: state }));
  }

  private buildCharts(data: ComunidadeMetricas): void {
    this.cidadesChartData.set({
      labels: data.topCidades.map((c) => c.cidade),
      datasets: [
        {
          data: data.topCidades.map((c) => c.quantidade),
          backgroundColor: 'rgba(129, 199, 212, 0.7)',
          borderColor: '#81c7d4',
          borderWidth: 1,
        },
      ],
    });

    this.formatosChartData.set({
      labels: data.topFormatos.map((f) => f.formato),
      datasets: [
        {
          data: data.topFormatos.map((f) => f.quantidade),
          backgroundColor: [
            '#81c7d4', '#a8d8a8', '#c4b7e6', '#f7d794',
            '#e6a0c4', '#7ecfc0', '#f3a683', '#aab6d3',
          ],
          borderWidth: 0,
        },
      ],
    });
  }
}
