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
          backgroundColor: 'rgba(245, 130, 32, 0.7)',
          borderColor: '#f58220',
          borderWidth: 1,
        },
        {
          label: 'Mesas',
          data: m.evolucaoRodadas.map((r) => r.mesas),
          backgroundColor: 'rgba(255, 159, 68, 0.5)',
          borderColor: '#ff9f44',
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
            '#f58220', '#ff9f44', '#ffb74d', '#e65100',
            '#ff6d00', '#bf360c', '#d84315', '#ff8f00',
            '#ef6c00', '#f4511e',
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
          borderColor: '#f58220',
          backgroundColor: 'rgba(245, 130, 32, 0.15)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#f58220',
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
