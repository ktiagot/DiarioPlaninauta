import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminService } from '../../../core/admin/admin.service';
import { InscritoResumo } from '../../../core/admin/admin.models';
import {
  AbrirRodadaContext,
  RodadaListItem,
  SorteioSnapshot,
} from '../../../core/sorteio/sorteio.models';
import { Mesa, Rodada } from '../../../core/rodadas/rodadas.models';
import { RodadasService } from '../../../core/rodadas/rodadas.service';
import { AdminDashboardComponent } from '../dashboard/admin-dashboard';
import { AdminCampeonatosComponent } from './admin-campeonatos';
import { AdminPreconsComponent } from './admin-precons';
import { MesaCardComponent } from '../../mesas/mesa-card/mesa-card';

@Component({
  selector: 'app-admin-campeonato',
  imports: [
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
    AdminDashboardComponent,
    AdminCampeonatosComponent,
    AdminPreconsComponent,
    MesaCardComponent,
  ],
  templateUrl: './admin-campeonato.html',
  styleUrl: './admin-campeonato.scss',
})
export class AdminCampeonatoComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly rodadasService = inject(RodadasService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly snapshot = signal<SorteioSnapshot | null>(null);
  readonly rodadas = signal<RodadaListItem[]>([]);
  readonly contexto = signal<AbrirRodadaContext | null>(null);
  readonly inscritos = signal<InscritoResumo[]>([]);
  readonly rodadaAtual = signal<Rodada | null>(null);
  readonly error = signal<string | null>(null);
  readonly sorteando = signal(false);
  readonly reSorteando = signal(false);
  readonly abrindoRodada = signal(false);
  readonly togglingCheckInId = signal<string | null>(null);
  readonly togglingInscricaoId = signal<string | null>(null);
  readonly campeonatoEncerrado = signal(false);
  readonly finalizandoRodada = signal(false);

  readonly rodadaNumero = signal(1);
  readonly rodadaData = signal('');

  readonly inscritosOrdenados = computed(() => this.inscritos());

  readonly inscritosAtivosCount = computed(
    () => this.inscritos().filter((i) => i.ativo).length,
  );

  readonly inscritosSuspensosCount = computed(
    () => this.inscritos().filter((i) => !i.ativo).length,
  );

  readonly rodadaEmCheckIn = computed(() => {
    const snap = this.snapshot();
    return snap && !snap.jaSorteada && snap.rodadaId != null;
  });

  readonly mesasSemReporte = computed(
    () => this.rodadaAtual()?.mesas.filter((m) => !m.finalizada) ?? [],
  );
  readonly mesasAguardando = computed(
    () => this.rodadaAtual()?.mesas.filter((m) => m.finalizada && !m.validada) ?? [],
  );
  readonly mesasValidadas = computed(
    () => this.rodadaAtual()?.mesas.filter((m) => m.validada) ?? [],
  );
  readonly totalMesasRodada = computed(() => this.rodadaAtual()?.mesas.length ?? 0);
  readonly totalMesasValidadas = computed(() => this.mesasValidadas().length);
  readonly podeFinalizarRodada = computed(() => {
    const rodada = this.rodadaAtual();
    if (!rodada || rodada.finalizada) return false;
    return rodada.podeFinalizar === true;
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getSorteio().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.loading.set(false);
      },
      error: () => {
        // Sem campeonato ativo (ex.: nenhum criado ainda) não é erro fatal:
        // libera as abas para que o admin possa criar o primeiro campeonato.
        this.snapshot.set(null);
        this.loading.set(false);
      },
    });

    this.adminService.listRodadas().subscribe({
      next: (res) => {
        this.rodadas.set(res.rodadas);
        this.contexto.set(res.contexto);
        this.rodadaNumero.set(res.contexto.proximoNumero);
      },
    });

    this.adminService.getInscritosAdmin().subscribe({
      next: (list) => this.inscritos.set(list),
    });

    this.adminService.listCampeonatos().subscribe({
      next: (list) => {
        const atual = list[0];
        this.campeonatoEncerrado.set(atual?.statusCode === 'ENCERRADO');
      },
    });

    this.carregarRodadaAtual();
  }

  abrirRodada(): void {
    const ctx = this.contexto();
    if (!ctx?.podeAbrirRodada || this.abrindoRodada()) return;

    const dataRodada = this.rodadaData().trim();
    if (!dataRodada) {
      this.snackBar.open('Informe a data da rodada.', 'Fechar', { duration: 4000 });
      return;
    }

    this.abrindoRodada.set(true);
    this.adminService
      .abrirRodada({ numero: this.rodadaNumero(), dataRodada })
      .subscribe({
        next: (snap) => {
          this.snapshot.set(snap);
          this.abrindoRodada.set(false);
          this.snackBar.open('Rodada aberta para check-in!', 'OK', { duration: 3000 });
          this.recarregarListas();
        },
        error: (err) => {
          this.abrindoRodada.set(false);
          this.snackBar.open(err?.error?.message || 'Erro ao abrir rodada.', 'Fechar', {
            duration: 5000,
          });
        },
      });
  }

  toggleCheckInAdmin(jogadorId: string, checkedIn: boolean): void {
    if (!this.rodadaEmCheckIn() || this.togglingCheckInId()) return;

    this.togglingCheckInId.set(jogadorId);
    this.adminService.adminCheckIn(jogadorId, !checkedIn).subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.togglingCheckInId.set(null);
      },
      error: (err) => {
        this.togglingCheckInId.set(null);
        this.snackBar.open(err?.error?.message || 'Erro ao atualizar check-in.', 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  sortearMesas(): void {
    this.sorteando.set(true);
    this.adminService.sortearMesas().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.sorteando.set(false);
        this.snackBar.open('Mesas sorteadas com sucesso!', 'OK', { duration: 3000 });
        this.recarregarListas();
      },
      error: (err) => {
        this.sorteando.set(false);
        this.snackBar.open(err?.error?.message || 'Erro ao sortear mesas.', 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  reSortearMesas(): void {
    this.reSorteando.set(true);
    this.adminService.reSortearMesas().subscribe({
      next: (snap) => {
        this.snapshot.set(snap);
        this.reSorteando.set(false);
        this.snackBar.open('Mesas re-sorteadas!', 'OK', { duration: 3000 });
        this.recarregarListas();
      },
      error: (err) => {
        this.reSorteando.set(false);
        this.snackBar.open(err?.error?.message || 'Erro ao re-sortear.', 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  statusLabel(status: RodadaListItem['status']): string {
    const map: Record<RodadaListItem['status'], string> = {
      CHECK_IN: 'Check-in',
      EM_ANDAMENTO: 'Em andamento',
      FINALIZADA: 'Finalizada',
    };
    return map[status];
  }

  statusBadgeClass(status: RodadaListItem['status']): string {
    if (status === 'FINALIZADA') return 'badge badge--done';
    if (status === 'EM_ANDAMENTO') return 'badge badge--active';
    return 'badge';
  }

  formatDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  toggleInscricaoAtivo(inscrito: InscritoResumo): void {
    if (this.campeonatoEncerrado() || this.togglingInscricaoId()) return;

    const suspender = inscrito.ativo;
    if (suspender) {
      const ok = window.confirm(
        `Suspender ${inscrito.nome} deste campeonato? O jogador sairá do ranking e não participará das próximas rodadas. Pontos e mesas já jogadas são mantidos.`,
      );
      if (!ok) return;
    }

    this.togglingInscricaoId.set(inscrito.id);
    this.adminService.setInscricaoAtivo(inscrito.id, !inscrito.ativo).subscribe({
      next: () => {
        this.togglingInscricaoId.set(null);
        this.snackBar.open(
          suspender ? 'Inscrição suspensa.' : 'Inscrição reativada.',
          'OK',
          { duration: 3000 },
        );
        this.adminService.getInscritosAdmin().subscribe({
          next: (list) => this.inscritos.set(list),
        });
        this.adminService.getSorteio().subscribe({
          next: (snap) => this.snapshot.set(snap),
        });
      },
      error: (err) => {
        this.togglingInscricaoId.set(null);
        this.snackBar.open(err?.error?.message || 'Erro ao atualizar inscrição.', 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  private carregarRodadaAtual(): void {
    this.rodadasService.getRodadaAtual().subscribe({
      next: (rodada) => this.rodadaAtual.set(rodada),
      error: () => this.rodadaAtual.set(null),
    });
  }

  onMesaAtualizada(mesaAtualizada: Mesa): void {
    const rodada = this.rodadaAtual();
    if (!rodada) return;
    const mesas = rodada.mesas.map((m) => (m.id === mesaAtualizada.id ? mesaAtualizada : m));
    this.rodadaAtual.set({
      ...rodada,
      mesas,
      podeFinalizar: !rodada.finalizada && mesas.length > 0 && mesas.every((m) => m.validada),
    });
  }

  onRodadaAtualizada(rodada: Rodada): void {
    this.rodadaAtual.set(rodada);
    this.recarregarListas();
  }

  finalizarRodada(): void {
    const rodada = this.rodadaAtual();
    if (!rodada || !this.podeFinalizarRodada() || this.finalizandoRodada()) return;

    const ok = window.confirm(
      'Finalizar a rodada? Os pontos serão somados na classificação e os resultados ficarão travados.',
    );
    if (!ok) return;

    this.finalizandoRodada.set(true);
    this.rodadasService
      .finalizarRodada(rodada.id)
      .pipe(finalize(() => this.finalizandoRodada.set(false)))
      .subscribe({
        next: (atualizada) => {
          this.rodadaAtual.set(atualizada);
          this.snackBar.open('Rodada finalizada! Pontos atualizados na classificação.', 'OK', {
            duration: 4000,
          });
          this.recarregarListas();
          this.adminService.getInscritosAdmin().subscribe({
            next: (list) => this.inscritos.set(list),
          });
        },
        error: (err: Error) => {
          this.snackBar.open(err.message || 'Erro ao finalizar a rodada.', 'Fechar', {
            duration: 5000,
          });
          this.carregarRodadaAtual();
        },
      });
  }

  private recarregarListas(): void {
    this.adminService.listRodadas().subscribe({
      next: (res) => {
        this.rodadas.set(res.rodadas);
        this.contexto.set(res.contexto);
        this.rodadaNumero.set(res.contexto.proximoNumero);
      },
    });
    this.carregarRodadaAtual();
  }
}
