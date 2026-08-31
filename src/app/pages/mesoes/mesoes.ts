import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { MesasService } from '../../core/mesas/mesas.service';
import { SessionService } from '../../core/auth/session.service';
import { Mesa } from '../../core/mesas/mesas.models';

type Filtro = 'todas' | 'abertas';

@Component({
  selector: 'app-mesoes',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
  ],
  templateUrl: './mesoes.html',
  styleUrl: './mesoes.scss',
})
export class MesoesComponent implements OnInit {
  private readonly mesasService = inject(MesasService);
  private readonly session = inject(SessionService);

  readonly mesas = signal<Mesa[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtroAtivo = signal<Filtro>('todas');
  readonly mostrarFormCriar = signal(false);
  readonly criando = signal(false);
  readonly linkEditandoId = signal<string | null>(null);
  readonly fechandoId = signal<string | null>(null);

  readonly novaMesaNome = signal('');
  readonly novaMesaDescricao = signal('');
  readonly novaMesaLink = signal('');
  readonly novaMesaData = signal<Date | null>(null); // datepicker (criação)
  readonly novaMesaHora = signal(''); // "HH:mm" (criação)
  readonly novoLink = signal('');
  readonly novaDescricao = signal('');
  readonly novaDataEdit = signal<Date | null>(null); // datepicker (edição)
  readonly novaHoraEdit = signal(''); // "HH:mm" (edição)

  readonly mesasFiltradas = computed(() => {
    const todas = this.mesas();
    if (this.filtroAtivo() === 'abertas') {
      return todas.filter((m) => !m.finalizada);
    }
    return todas;
  });

  readonly userId = computed(() => this.session.getUserId());

  ngOnInit(): void {
    this.carregarMesas();
  }

  carregarMesas(): void {
    this.loading.set(true);
    this.mesasService.listar().subscribe({
      next: (mesas) => {
        this.mesas.set(mesas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar as mesas.');
        this.loading.set(false);
      },
    });
  }

  setFiltro(filtro: Filtro): void {
    this.filtroAtivo.set(filtro);
  }

  toggleFormCriar(): void {
    this.mostrarFormCriar.update((v) => !v);
    if (!this.mostrarFormCriar()) {
      this.resetFormCriar();
    }
  }

  criarMesa(): void {
    const nome = this.novaMesaNome().trim();
    const data = this.novaMesaData();
    const hora = this.novaMesaHora();
    if (!nome || !data || !hora) return;

    this.criando.set(true);
    const payload = {
      nome,
      dataHora: this.dataHoraParaIso(data, hora),
      ...(this.novaMesaDescricao().trim() ? { descricao: this.novaMesaDescricao().trim() } : {}),
      ...(this.novaMesaLink().trim() ? { linkPartida: this.novaMesaLink().trim() } : {}),
    };

    this.mesasService.criar(payload).subscribe({
      next: (mesa) => {
        this.mesas.update((list) => [...list, mesa]);
        this.mostrarFormCriar.set(false);
        this.resetFormCriar();
        this.criando.set(false);
      },
      error: () => {
        this.criando.set(false);
      },
    });
  }

  isDono(mesa: Mesa): boolean {
    return !!mesa.criadorUserId && mesa.criadorUserId === this.userId();
  }

  iniciarEdicaoLink(mesa: Mesa): void {
    this.linkEditandoId.set(mesa.id);
    this.novoLink.set(mesa.linkPartida ?? '');
    this.novaDescricao.set(mesa.descricao ?? '');
    this.novaDataEdit.set(this.isoParaData(mesa.dataHora));
    this.novaHoraEdit.set(this.isoParaHora(mesa.dataHora));
  }

  cancelarEdicaoLink(): void {
    this.linkEditandoId.set(null);
    this.novoLink.set('');
    this.novaDescricao.set('');
    this.novaDataEdit.set(null);
    this.novaHoraEdit.set('');
  }

  salvarEdicao(mesaId: string): void {
    const link = this.novoLink().trim();
    const descricao = this.novaDescricao().trim();
    const data = this.novaDataEdit();
    const hora = this.novaHoraEdit();
    if (!data || !hora) return;

    this.mesasService
      .editar(mesaId, {
        dataHora: this.dataHoraParaIso(data, hora),
        linkPartida: link || undefined,
        descricao,
      })
      .subscribe({
        next: (mesaAtualizada) => {
          this.mesas.update((list) =>
            list.map((m) => (m.id === mesaId ? mesaAtualizada : m)),
          );
          this.cancelarEdicaoLink();
        },
      });
  }

  fecharMesa(mesaId: string): void {
    this.fechandoId.set(mesaId);
    this.mesasService.fechar(mesaId).subscribe({
      next: (mesaAtualizada) => {
        this.mesas.update((list) =>
          list.map((m) => (m.id === mesaId ? mesaAtualizada : m)),
        );
        this.fechandoId.set(null);
      },
      error: () => {
        this.fechandoId.set(null);
      },
    });
  }

  private resetFormCriar(): void {
    this.novaMesaNome.set('');
    this.novaMesaDescricao.set('');
    this.novaMesaLink.set('');
    this.novaMesaData.set(null);
    this.novaMesaHora.set('');
  }

  // Fuso fixo do projeto: UTC-3 (America/Sao_Paulo, sem horário de verão).
  private static readonly TZ_OFFSET_MIN = -180;

  /**
   * Combina a data do datepicker (ano/mês/dia local do objeto Date) com a hora
   * "HH:mm", interpretados como UTC-3, e devolve string ISO em UTC.
   */
  private dataHoraParaIso(data: Date, hora: string): string {
    const [h, min] = hora.split(':').map(Number);
    const utcMs =
      Date.UTC(data.getFullYear(), data.getMonth(), data.getDate(), h, min) -
      MesoesComponent.TZ_OFFSET_MIN * 60 * 1000;
    return new Date(utcMs).toISOString();
  }

  /** ISO (UTC) -> objeto Date representando o dia em UTC-3 (para o datepicker). */
  private isoParaData(iso: string): Date {
    const localMs = new Date(iso).getTime() + MesoesComponent.TZ_OFFSET_MIN * 60 * 1000;
    const d = new Date(localMs);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  /** ISO (UTC) -> "HH:mm" em UTC-3 (para o input de hora). */
  private isoParaHora(iso: string): string {
    const localMs = new Date(iso).getTime() + MesoesComponent.TZ_OFFSET_MIN * 60 * 1000;
    const d = new Date(localMs);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  }

  /** Exibição amigável no card, sempre em UTC-3. */
  formatarDataHora(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
