import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Mesa, Rodada } from '../../core/rodadas/rodadas.models';
import { RodadasService } from '../../core/rodadas/rodadas.service';
import { MesaCardComponent } from './mesa-card/mesa-card';

@Component({
  selector: 'app-mesas',
  imports: [MatButtonModule, MatProgressSpinnerModule, MesaCardComponent],
  templateUrl: './mesas.html',
  styleUrl: './mesas.scss',
})
export class MesasComponent implements OnInit {
  private readonly rodadasService = inject(RodadasService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly rodada = signal<Rodada | null>(null);

  ngOnInit(): void {
    this.carregarRodada();
  }

  protected carregarRodada(): void {
    this.loading.set(true);
    this.error.set(null);

    this.rodadasService.getRodadaAtual().subscribe({
      next: (rodada) => {
        this.rodada.set(rodada);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Erro ao carregar mesas.');
        this.loading.set(false);
      },
    });
  }

  protected totalMesas(): number {
    return this.rodada()?.mesas.length ?? 0;
  }

  protected onMesaAtualizada(mesaAtualizada: Mesa): void {
    const rodada = this.rodada();
    if (!rodada) return;

    this.rodada.set({
      ...rodada,
      mesas: rodada.mesas.map((m) => (m.id === mesaAtualizada.id ? mesaAtualizada : m)),
    });
  }
}
