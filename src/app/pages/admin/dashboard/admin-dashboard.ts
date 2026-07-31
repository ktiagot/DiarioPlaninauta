import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import '../../../core/config/chart.config';

import { AdminService, DashboardMetricas } from '../../../core/admin/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly metricas = signal<DashboardMetricas | null>(null);

  // Chart configs
  readonly evolucaoChartData = computed<ChartData<'bar'>>(() => {
    const m = this.metricas();
    if (!m) return { labels: [], datasets: [] };
    return {
      labels: m.evolucaoRodadas.map((r) => r.label),
      datasets: [
        {
          label: 'Jogadores',
          data: m.evolucaoRodadas.map((r) => r.jogadores),
          backgroundColor: 'rgba(129, 199, 212, 0.75)',
          borderColor: '#81c7d4',
          borderWidth: 1,
        },
        {
          label: 'Mesas',
          data: m.evolucaoRodadas.map((r) => r.mesas),
          backgroundColor: 'rgba(245, 130, 32, 0.7)',
          borderColor: '#f58220',
          borderWidth: 1,
        },
      ],
    };
  });

  readonly evolucaoChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#ccc' } },
    },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
    },
  };

  readonly metagameChartData = computed<ChartData<'doughnut'>>(() => {
    const m = this.metricas();
    if (!m) return { labels: [], datasets: [] };
    return {
      labels: m.metagameDistribuicao.map((d) => d.comandante),
      datasets: [
        {
          data: m.metagameDistribuicao.map((d) => d.quantidade),
          backgroundColor: [
            '#81c7d4', // azul pastel
            '#f58220', // laranja (primária)
            '#a8d8a8', // verde pastel
            '#e6a0c4', // rosa pastel
            '#c4b7e6', // lilás pastel
            '#f7d794', // amarelo pastel
            '#7ecfc0', // turquesa pastel
            '#f3a683', // salmão pastel
            '#aab6d3', // azul acinzentado
            '#d4a5a5', // rosé pastel
          ],
          borderWidth: 0,
        },
      ],
    };
  });

  readonly metagameChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#ccc', padding: 12 },
      },
    },
  };

  readonly killsChartData = computed<ChartData<'line'>>(() => {
    const m = this.metricas();
    if (!m) return { labels: [], datasets: [] };
    return {
      labels: m.topKillsPorRodada.map((r) => r.label),
      datasets: [
        {
          label: 'Kills por rodada',
          data: m.topKillsPorRodada.map((r) => r.kills),
          borderColor: '#e6a0c4',
          backgroundColor: 'rgba(230, 160, 196, 0.12)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#e6a0c4',
        },
      ],
    };
  });

  readonly killsChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#ccc' } },
    },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
    },
  };

  ngOnInit(): void {
    this.adminService.getDashboardMetricas().subscribe({
      next: (data) => {
        this.metricas.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
