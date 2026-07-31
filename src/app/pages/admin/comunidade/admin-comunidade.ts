import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import '../../../core/config/chart.config';

import { API_URL } from '../../../core/config/api.config';

interface ComunidadeMetricas {
  totalMembros: number;
  apoiadoresAtivos: number;
  exApoiadores: number;
  totalFavoritos: number;
  topCidades: { cidade: string; quantidade: number }[];
  topFormatos: { formato: string; quantidade: number }[];
}

@Component({
  selector: 'app-admin-comunidade',
  imports: [
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

  readonly loading = signal(true);
  readonly metricas = signal<ComunidadeMetricas | null>(null);

  readonly cidadesChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly formatosChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  readonly cidadesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
      y: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255,255,255,0.05)' } },
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
