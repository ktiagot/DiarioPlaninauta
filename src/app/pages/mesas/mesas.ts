import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { SessionService } from '../../core/auth/session.service';
import { Mesa, Rodada, RodadaResumo } from '../../core/rodadas/rodadas.models';
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
  private readonly session = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly rodada = signal<Rodada | null>(null);
  protected readonly finalizando = signal(false);

  /** Rodadas já sorteadas (abas de histórico). */
  protected readonly rodadas = signal<RodadaResumo[]>([]);
  protected readonly numeroSelecionado = signal<number | null>(null);
  protected readonly carregandoRodada = signal(false);

  protected readonly podeFinalizar = computed(() => {
    const rodada = this.rodada();
    if (!rodada || !this.session.isAdmin() || rodada.finalizada) return false;
    if (rodada.podeFinalizar != null) return rodada.podeFinalizar;
    return rodada.mesas.length > 0 && rodada.mesas.every((m) => m.validada);
  });

  ngOnInit(): void {
    this.carregarRodada();
    this.rodadasService.listarRodadasResumo().subscribe((lista) => this.rodadas.set(lista));
  }

  /** Mostra a rodada escolhida na aba (a última/atual é a padrão). */
  protected selecionarRodada(numero: number): void {
    if (numero === this.numeroSelecionado() || this.carregandoRodada()) return;

    this.carregandoRodada.set(true);
    this.rodadasService
      .getRodadaPorNumero(numero)
      .pipe(finalize(() => this.carregandoRodada.set(false)))
      .subscribe({
        next: (rodada) => {
          if (!rodada) return;
          this.rodada.set(rodada);
          this.numeroSelecionado.set(rodada.numero);
        },
        error: (err: Error) => {
          this.snackBar.open(err.message || 'Erro ao carregar a rodada.', 'Fechar', {
            duration: 5000,
          });
        },
      });
  }

  /** Mantém a aba em sincronia quando a rodada exibida é finalizada. */
  private marcarFinalizada(numero: number, finalizada: boolean): void {
    this.rodadas.update((lista) =>
      lista.map((r) => (r.numero === numero ? { ...r, finalizada } : r)),
    );
  }

  protected carregarRodada(): void {
    this.loading.set(true);
    this.error.set(null);

    this.rodadasService.getRodadaAtual().subscribe({
      next: (rodada) => {
        this.rodada.set(rodada);
        this.numeroSelecionado.set(rodada?.numero ?? null);
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

    const mesas = rodada.mesas.map((m) => (m.id === mesaAtualizada.id ? mesaAtualizada : m));
    this.rodada.set({
      ...rodada,
      mesas,
      podeFinalizar: !rodada.finalizada && mesas.length > 0 && mesas.every((m) => m.validada),
    });
  }

  protected onRodadaAtualizada(rodada: Rodada): void {
    this.rodada.set(rodada);
    this.marcarFinalizada(rodada.numero, !!rodada.finalizada);
  }

  protected finalizarRodada(): void {
    const rodada = this.rodada();
    if (!rodada || !this.podeFinalizar() || this.finalizando()) return;

    const ok = window.confirm(
      'Finalizar a rodada? Os pontos serão somados na classificação e os resultados ficarão travados.',
    );
    if (!ok) return;

    this.finalizando.set(true);
    this.rodadasService
      .finalizarRodada(rodada.id)
      .pipe(finalize(() => this.finalizando.set(false)))
      .subscribe({
        next: (atualizada) => {
          this.rodada.set(atualizada);
          this.marcarFinalizada(atualizada.numero, true);
          this.snackBar.open('Rodada finalizada! Pontos atualizados na classificação.', 'Fechar', {
            duration: 5000,
          });
        },
        error: (err: Error) => {
          this.snackBar.open(err.message || 'Erro ao finalizar a rodada.', 'Fechar', {
            duration: 5000,
          });
        },
      });
  }
}
