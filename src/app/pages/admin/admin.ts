import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { AdminService, InscritoResumo, SubmitResultadoPayload } from '../../core/admin/admin.service';
import { SorteioSnapshot, SorteioMesa, RodadaAtual } from '../../core/admin/admin.models';

@Component({
  selector: 'app-admin',
  imports: [
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    FormsModule,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly snapshot = signal<SorteioSnapshot | null>(null);
  readonly inscritos = signal<InscritoResumo[]>([]);
  readonly rodadaAtual = signal<RodadaAtual | null>(null);
  readonly error = signal<string | null>(null);
  readonly sorteando = signal(false);
  readonly finalizando = signal(false);
  readonly submittingMesaId = signal<string | null>(null);

  // Resultado editing state per mesa
  readonly editandoResultadoMesaId = signal<string | null>(null);
  readonly resultadoJogadores = signal<{ inscricaoId: string; posicaoFinal: number; kills: number }[]>([]);
  readonly resultadoEmpate = signal(false);
  readonly resultadoLink = signal('');

  readonly inscritosOrdenados = computed(() =>
    [...this.inscritos()].sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999)),
  );

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.adminService.getSorteio().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Erro ao carregar dados admin.');
        this.loading.set(false);
      },
    });

    this.adminService.getInscritos().subscribe({
      next: (list) => this.inscritos.set(list),
    });

    this.adminService.getRodadaAtual().subscribe({
      next: (rodada) => this.rodadaAtual.set(rodada),
    });
  }

  sortearMesas(): void {
    this.sorteando.set(true);
    this.adminService.sortearMesas().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.sorteando.set(false);
        this.snackBar.open('Mesas sorteadas com sucesso!', 'OK', { duration: 3000 });
        this.carregarDados();
      },
      error: (err) => {
        this.sorteando.set(false);
        this.snackBar.open(err?.error?.message || 'Erro ao sortear mesas.', 'Fechar', { duration: 5000 });
      },
    });
  }

  finalizarRodada(): void {
    const snap = this.snapshot();
    if (!snap?.rodadaId) return;

    this.finalizando.set(true);
    this.adminService.finalizarRodada(snap.rodadaId).subscribe({
      next: () => {
        this.finalizando.set(false);
        this.snackBar.open('Rodada finalizada!', 'OK', { duration: 3000 });
        this.carregarDados();
      },
      error: (err) => {
        this.finalizando.set(false);
        this.snackBar.open(err?.error?.message || 'Erro ao finalizar rodada.', 'Fechar', { duration: 5000 });
      },
    });
  }

  iniciarResultado(mesa: SorteioMesa): void {
    this.editandoResultadoMesaId.set(mesa.mesaId);
    this.resultadoJogadores.set(
      mesa.jogadores.map((j) => ({
        inscricaoId: j.inscricaoId,
        posicaoFinal: j.posicaoFinal ?? 0,
        kills: j.kills,
      })),
    );
    this.resultadoEmpate.set(false);
    this.resultadoLink.set(mesa.linkPartida || '');
  }

  cancelarResultado(): void {
    this.editandoResultadoMesaId.set(null);
  }

  submitResultado(mesaId: string): void {
    const payload: SubmitResultadoPayload = {
      jogadores: this.resultadoJogadores(),
      empate: this.resultadoEmpate(),
      linkPartida: this.resultadoLink().trim() || undefined,
    };

    this.submittingMesaId.set(mesaId);
    this.adminService.submitResultado(mesaId, payload).subscribe({
      next: () => {
        this.submittingMesaId.set(null);
        this.editandoResultadoMesaId.set(null);
        this.snackBar.open('Resultado salvo!', 'OK', { duration: 3000 });
        this.carregarDados();
      },
      error: (err) => {
        this.submittingMesaId.set(null);
        this.snackBar.open(err?.error?.message || 'Erro ao salvar resultado.', 'Fechar', { duration: 5000 });
      },
    });
  }

  updateJogadorPosicao(inscricaoId: string, posicao: number): void {
    this.resultadoJogadores.update((list) =>
      list.map((j) => (j.inscricaoId === inscricaoId ? { ...j, posicaoFinal: posicao } : j)),
    );
  }

  updateJogadorKills(inscricaoId: string, kills: number): void {
    this.resultadoJogadores.update((list) =>
      list.map((j) => (j.inscricaoId === inscricaoId ? { ...j, kills } : j)),
    );
  }

  getNomeJogador(inscricaoId: string, mesa: SorteioMesa): string {
    return mesa.jogadores.find((j) => j.inscricaoId === inscricaoId)?.nick || 'Desconhecido';
  }
}
