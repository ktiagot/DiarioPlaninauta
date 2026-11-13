import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, finalize } from 'rxjs';

import { AdminService } from '../../../core/admin/admin.service';
import { InscritoResumo } from '../../../core/admin/admin.models';
import { RodadaListItem } from '../../../core/sorteio/sorteio.models';
import { Mesa, Rodada } from '../../../core/rodadas/rodadas.models';
import { MesaCardComponent } from '../../mesas/mesa-card/mesa-card';

const AVISO_RODADA_FINALIZADA =
  'Esta rodada já foi finalizada. Salvar a correção recalcula pontos e classificação de todo o campeonato. Continuar?';

@Component({
  selector: 'app-admin-gerenciar',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MesaCardComponent,
  ],
  templateUrl: './admin-gerenciar.html',
  styleUrl: './admin-gerenciar.scss',
})
export class AdminGerenciarComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  /** Emitido após qualquer alteração (para o pai recarregar classificação/inscritos). */
  readonly alterado = output<void>();

  readonly rodadas = signal<RodadaListItem[]>([]);
  readonly inscritos = signal<InscritoResumo[]>([]);
  readonly loading = signal(true);
  readonly selecionadaId = signal<string | null>(null);
  readonly detalhe = signal<Rodada | null>(null);
  readonly loadingDetalhe = signal(false);
  readonly busy = signal(false);

  readonly editNumero = signal(1);
  readonly editData = signal('');
  /** Jogador escolhido no select "adicionar" por mesaId. */
  readonly novoJogador = signal<Record<string, string>>({});

  readonly avisoCorrecao = computed(() =>
    this.detalhe()?.finalizada ? AVISO_RODADA_FINALIZADA : null,
  );

  readonly ativos = computed(() => this.inscritos().filter((i) => i.ativo));

  ngOnInit(): void {
    this.carregarRodadas();
    this.adminService.getInscritosAdmin().subscribe({
      next: (l) => this.inscritos.set(l),
    });
  }

  carregarRodadas(): void {
    this.loading.set(true);
    this.adminService
      .listRodadas()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.rodadas.set(res.rodadas),
        error: (err) => this.erro(err),
      });
  }

  selecionar(rodada: RodadaListItem): void {
    this.selecionadaId.set(rodada.id);
    this.carregarDetalhe(rodada.id);
  }

  private carregarDetalhe(id: string): void {
    this.loadingDetalhe.set(true);
    this.detalhe.set(null);
    this.adminService
      .getRodadaDetalhe(id)
      .pipe(finalize(() => this.loadingDetalhe.set(false)))
      .subscribe({
        next: (r) => this.aplicar(r),
        error: (err) => this.erro(err),
      });
  }

  private aplicar(r: Rodada): void {
    this.detalhe.set(r);
    this.editNumero.set(r.numero);
    this.editData.set(r.dataRodada ?? '');
  }

  onMesaAtualizada(mesa: Mesa): void {
    const r = this.detalhe();
    if (!r) return;
    this.detalhe.set({ ...r, mesas: r.mesas.map((m) => (m.id === mesa.id ? mesa : m)) });
  }

  onRodadaAtualizada(rodada: Rodada): void {
    this.aplicar(rodada);
    this.carregarRodadas();
    this.alterado.emit();
  }

  // ---- ações de rodada ----

  salvarRodada(): void {
    const r = this.detalhe();
    if (!r) return;
    const numero = this.editNumero();
    if (!numero || numero < 1) {
      this.snackBar.open('Número inválido.', 'Fechar', { duration: 3000 });
      return;
    }
    this.executar(
      this.adminService.atualizarRodada(r.id, {
        numero,
        ...(this.editData() ? { dataRodada: this.editData() } : {}),
      }),
      'Rodada atualizada.',
    );
  }

  reabrir(): void {
    const r = this.detalhe();
    if (!r) return;
    if (
      !window.confirm(
        'Reabrir a rodada desfaz a finalização e recalcula pontos e classificação. Continuar?',
      )
    ) {
      return;
    }
    this.executar(this.adminService.reabrirRodada(r.id), 'Rodada reaberta.');
  }

  excluirRodada(): void {
    const r = this.detalhe();
    if (!r) return;
    if (
      !window.confirm(
        `Excluir a rodada ${r.numero}? Mesas, resultados e check-ins serão apagados. Isso não pode ser desfeito.`,
      )
    ) {
      return;
    }
    this.busy.set(true);
    this.adminService
      .excluirRodada(r.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Rodada excluída.', 'OK', { duration: 3000 });
          this.detalhe.set(null);
          this.selecionadaId.set(null);
          this.carregarRodadas();
          this.alterado.emit();
        },
        error: (err) => this.erro(err),
      });
  }

  novaMesa(): void {
    const r = this.detalhe();
    if (r) this.executar(this.adminService.criarMesa(r.id), 'Mesa criada.');
  }

  // ---- ações de mesa ----

  excluirMesa(mesa: Mesa): void {
    if (!window.confirm(`Excluir a mesa ${mesa.numeroMesa}? Os jogadores ficam sem mesa nesta rodada.`)) {
      return;
    }
    this.executar(this.adminService.excluirMesa(mesa.id), 'Mesa excluída.');
  }

  invalidar(mesa: Mesa): void {
    this.executar(this.adminService.invalidarMesa(mesa.id), 'Mesa invalidada.');
  }

  limpar(mesa: Mesa): void {
    const extra = this.detalhe()?.finalizada ? ' Pontos e classificação serão recalculados.' : '';
    if (!window.confirm(`Limpar o resultado da mesa ${mesa.numeroMesa}?${extra}`)) return;
    this.executar(this.adminService.limparResultadoMesa(mesa.id), 'Resultado limpo.');
  }

  removerJogador(mesa: Mesa, inscricaoId: string): void {
    this.executar(this.adminService.removerJogadorMesa(mesa.id, inscricaoId), 'Jogador removido.');
  }

  moverJogador(inscricaoId: string, paraMesaId: string): void {
    if (!paraMesaId) return;
    this.executar(this.adminService.colocarJogador(paraMesaId, inscricaoId), 'Jogador movido.');
  }

  adicionarJogador(mesa: Mesa): void {
    const inscricaoId = this.novoJogador()[mesa.id];
    if (!inscricaoId) return;
    this.executar(
      this.adminService.colocarJogador(mesa.id, inscricaoId),
      'Jogador colocado na mesa.',
      () => this.novoJogador.update((m) => ({ ...m, [mesa.id]: '' })),
    );
  }

  setNovoJogador(mesaId: string, inscricaoId: string): void {
    this.novoJogador.update((m) => ({ ...m, [mesaId]: inscricaoId }));
  }

  outrasMesas(mesa: Mesa): Mesa[] {
    return (this.detalhe()?.mesas ?? []).filter((m) => m.id !== mesa.id);
  }

  /** Onde o inscrito está sentado nesta rodada (para rotular o select de adição). */
  mesaDe(inscricaoId: string): number | null {
    const m = this.detalhe()?.mesas.find((x) => x.jogadores.some((j) => j.inscricaoId === inscricaoId));
    return m?.numeroMesa ?? null;
  }

  jogadoresDisponiveis(mesa: Mesa): InscritoResumo[] {
    const naMesa = new Set(mesa.jogadores.map((j) => j.inscricaoId));
    return this.ativos().filter((i) => !naMesa.has(i.id));
  }

  statusLabel(status: RodadaListItem['status']): string {
    return { CHECK_IN: 'Check-in', EM_ANDAMENTO: 'Em andamento', FINALIZADA: 'Finalizada' }[status];
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
  }

  private executar(obs: Observable<Rodada>, msg: string, depois?: () => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    obs.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (r) => {
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.aplicar(r);
        depois?.();
        this.carregarRodadas();
        this.alterado.emit();
      },
      error: (err) => this.erro(err),
    });
  }

  private erro(err: { error?: { message?: string | string[] } }): void {
    const m = err?.error?.message;
    this.snackBar.open((Array.isArray(m) ? m[0] : m) || 'Erro.', 'Fechar', { duration: 5000 });
  }
}
