import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MesaoSessao, MesaoTipo } from '../../core/mesao-live/mesao-live.models';
import { MesaoLiveService } from '../../core/mesao-live/mesao-live.service';
import { formatarDataHora, mensagemErro } from '../../core/util/data-hora';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-mesao-live',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, PageHeaderComponent],
  templateUrl: './mesao-live.html',
  styleUrl: './mesao-live.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MesaoLiveComponent implements OnInit {
  private readonly service = inject(MesaoLiveService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly formatarDataHora = formatarDataHora;
  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly sessoes = signal<MesaoSessao[]>([]);
  protected readonly enviandoId = signal<string | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.service.listar().subscribe({
      next: (lista) => {
        this.sessoes.set(lista);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemErro(err, 'Não foi possível carregar as datas.'));
        this.loading.set(false);
      },
    });
  }

  protected vagasLivres(s: MesaoSessao, tipo: MesaoTipo): number {
    return tipo === 'JOGADOR'
      ? s.vagasJogador - s.jogadores.length
      : s.vagasSuplente - s.suplentes.length;
  }

  protected slots(total: number, ocupados: { nick: string }[]): (string | null)[] {
    return Array.from({ length: total }, (_, i) => ocupados[i]?.nick ?? null);
  }

  protected inscrever(s: MesaoSessao, tipo: MesaoTipo): void {
    if (this.enviandoId()) return;
    this.enviandoId.set(s.id);
    this.service.inscrever(s.id, tipo).subscribe({
      next: (nova) => {
        this.sessoes.update((l) => l.map((x) => (x.id === nova.id ? nova : x)));
        this.enviandoId.set(null);
        this.snackBar.open(
          tipo === 'JOGADOR' ? 'Você está na mesa como jogador!' : 'Você entrou como suplente.',
          'OK',
          { duration: 4000 },
        );
      },
      error: (err: unknown) => {
        this.enviandoId.set(null);
        this.snackBar.open(mensagemErro(err, 'Não foi possível se inscrever.'), 'OK', { duration: 6000 });
        this.carregar();
      },
    });
  }

  protected cancelar(s: MesaoSessao): void {
    if (!confirm('Cancelar sua inscrição nesta data?')) return;
    this.service.cancelar(s.id).subscribe({
      next: () => {
        this.snackBar.open('Inscrição cancelada.', 'OK', { duration: 3000 });
        this.carregar();
      },
      error: (err: unknown) =>
        this.snackBar.open(mensagemErro(err, 'Não foi possível cancelar.'), 'OK', { duration: 5000 }),
    });
  }
}
