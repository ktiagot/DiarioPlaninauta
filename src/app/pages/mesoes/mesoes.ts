import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  readonly novaMesaDataHora = signal(''); // valor do input datetime-local
  readonly novoLink = signal('');
  readonly novaDescricao = signal('');
  readonly novaData = signal(''); // valor do input datetime-local (edição)

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
    const dataHoraLocal = this.novaMesaDataHora();
    if (!nome || !dataHoraLocal) return;

    this.criando.set(true);
    const payload = {
      nome,
      dataHora: this.localParaIso(dataHoraLocal),
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
    this.novaData.set(this.isoParaLocal(mesa.dataHora));
  }

  cancelarEdicaoLink(): void {
    this.linkEditandoId.set(null);
    this.novoLink.set('');
    this.novaDescricao.set('');
    this.novaData.set('');
  }

  salvarEdicao(mesaId: string): void {
    const link = this.novoLink().trim();
    const descricao = this.novaDescricao().trim();
    const dataHoraLocal = this.novaData();
    if (!dataHoraLocal) return;

    this.mesasService
      .editar(mesaId, {
        dataHora: this.localParaIso(dataHoraLocal),
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
    this.novaMesaDataHora.set('');
  }

  // Fuso fixo do projeto: UTC-3 (America/Sao_Paulo, sem horário de verão).
  private static readonly TZ_OFFSET_MIN = -180;

  /**
   * Converte o valor do input datetime-local ("YYYY-MM-DDTHH:mm"), interpretado
   * como horário UTC-3, para uma string ISO em UTC para enviar ao backend.
   */
  private localParaIso(local: string): string {
    const [dataParte, horaParte] = local.split('T');
    const [ano, mes, dia] = dataParte.split('-').map(Number);
    const [hora, minuto] = horaParte.split(':').map(Number);
    // Instante UTC = horário local - offset (offset é negativo, então subtrai um valor negativo = soma).
    const utcMs = Date.UTC(ano, mes - 1, dia, hora, minuto) - MesoesComponent.TZ_OFFSET_MIN * 60 * 1000;
    return new Date(utcMs).toISOString();
  }

  /**
   * Converte uma string ISO (UTC) para o formato do input datetime-local
   * ("YYYY-MM-DDTHH:mm") no fuso UTC-3.
   */
  private isoParaLocal(iso: string): string {
    const utc = new Date(iso);
    const localMs = utc.getTime() + MesoesComponent.TZ_OFFSET_MIN * 60 * 1000;
    const d = new Date(localMs);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
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
