import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { MesasService } from '../../core/mesas/mesas.service';
import { SessionService } from '../../core/auth/session.service';
import { Mesa } from '../../core/mesas/mesas.models';
import { PreconComandante, PreconListItem } from '../../core/precons/precons.models';
import { PreconsService } from '../../core/precons/precons.service';

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
    MatSelectModule,
  ],
  templateUrl: './mesoes.html',
  styleUrl: './mesoes.scss',
})
export class MesoesComponent implements OnInit {
  private readonly mesasService = inject(MesasService);
  private readonly preconsService = inject(PreconsService);
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
  readonly novoLink = signal('');
  readonly novaDescricao = signal('');

  readonly precons = signal<PreconListItem[]>([]);
  readonly comandantes = signal<PreconComandante[]>([]);
  readonly novaMesaPreconId = signal('');
  readonly novaMesaComandanteId = signal('');

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
    this.preconsService.search().subscribe({
      next: (list) => this.precons.set(list),
    });
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

  onPreconChange(preconId: string): void {
    this.novaMesaPreconId.set(preconId);
    this.novaMesaComandanteId.set('');
    this.comandantes.set([]);
    if (preconId) {
      this.preconsService.listComandantes(preconId).subscribe({
        next: (cmds) => this.comandantes.set(cmds),
      });
    }
  }

  criarMesa(): void {
    const nome = this.novaMesaNome().trim();
    if (!nome) return;

    this.criando.set(true);
    const payload = {
      nome,
      ...(this.novaMesaDescricao().trim() ? { descricao: this.novaMesaDescricao().trim() } : {}),
      ...(this.novaMesaLink().trim() ? { linkPartida: this.novaMesaLink().trim() } : {}),
      ...(this.novaMesaPreconId() && this.novaMesaComandanteId()
        ? {
            preconId: this.novaMesaPreconId(),
            preconComandanteId: this.novaMesaComandanteId(),
          }
        : {}),
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
  }

  cancelarEdicaoLink(): void {
    this.linkEditandoId.set(null);
    this.novoLink.set('');
    this.novaDescricao.set('');
  }

  salvarEdicao(mesaId: string): void {
    const link = this.novoLink().trim();
    const descricao = this.novaDescricao().trim();

    this.mesasService
      .editar(mesaId, {
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
    this.novaMesaPreconId.set('');
    this.novaMesaComandanteId.set('');
    this.comandantes.set([]);
  }
}
