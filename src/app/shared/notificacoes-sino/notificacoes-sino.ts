import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificacoesService } from '../../core/notificacoes/notificacoes.service';
import { Notificacao } from '../../core/notificacoes/notificacoes.models';
import { MesasService } from '../../core/mesas/mesas.service';

const POLLING_INTERVAL_MS = 25_000;

@Component({
  selector: 'app-notificacoes-sino',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './notificacoes-sino.html',
  styleUrl: './notificacoes-sino.scss',
})
export class NotificacoesSinoComponent implements OnInit {
  private readonly notificacoesService = inject(NotificacoesService);
  private readonly mesasService = inject(MesasService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  private pollingId: ReturnType<typeof setInterval> | null = null;
  protected readonly respondendo = signal<string | null>(null);

  protected readonly naoLidas = signal(0);
  protected readonly notificacoes = signal<Notificacao[]>([]);
  protected readonly dropdownAberto = signal(false);
  protected readonly carregando = signal(false);

  ngOnInit(): void {
    this.buscarContagem();
    this.iniciarPolling();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownAberto.set(false);
    }
  }

  protected toggleDropdown(): void {
    const abrir = !this.dropdownAberto();
    this.dropdownAberto.set(abrir);
    if (abrir) {
      this.buscarNotificacoes();
    }
  }

  protected marcarComoLida(notificacao: Notificacao): void {
    if (notificacao.lida) return;

    this.notificacoesService
      .marcarComoLida(notificacao.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notificacoes.update((lista) =>
          lista.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n)),
        );
        this.naoLidas.update((c) => Math.max(0, c - 1));
      });
  }

  protected marcarTodasComoLidas(): void {
    this.notificacoesService
      .marcarTodasComoLidas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notificacoes.update((lista) => lista.map((n) => ({ ...n, lida: true })));
        this.naoLidas.set(0);
      });
  }

  protected excluir(notificacao: Notificacao, event: MouseEvent): void {
    event.stopPropagation();
    this.notificacoesService
      .excluir(notificacao.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notificacoes.update((lista) => lista.filter((n) => n.id !== notificacao.id));
        if (!notificacao.lida) this.naoLidas.update((c) => Math.max(0, c - 1));
      });
  }

  protected excluirTodas(): void {
    this.notificacoesService
      .excluirTodas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notificacoes.set([]);
        this.naoLidas.set(0);
      });
  }

  protected ehConviteAcionavel(n: Notificacao): boolean {
    return n.tipo === 'convite_mesa' && !!n.referenciaId && !n.lida;
  }

  protected aceitarConvite(n: Notificacao, event: MouseEvent): void {
    event.stopPropagation();
    if (!n.referenciaId || this.respondendo()) return;

    this.respondendo.set(n.id);
    this.mesasService
      .aceitarConvite(n.referenciaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resolverConvite(n);
          this.snackBar.open('Você entrou na mesa!', 'OK', { duration: 4000 });
        },
        error: (err) => {
          this.respondendo.set(null);
          const msg =
            (typeof err?.error?.message === 'string' ? err.error.message : null) ||
            'Não foi possível aceitar o convite.';
          this.snackBar.open(msg, 'OK', { duration: 5000 });
        },
      });
  }

  protected rejeitarConvite(n: Notificacao, event: MouseEvent): void {
    event.stopPropagation();
    if (!n.referenciaId || this.respondendo()) return;

    this.respondendo.set(n.id);
    this.mesasService
      .rejeitarConvite(n.referenciaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.resolverConvite(n),
        error: () => {
          this.respondendo.set(null);
          this.snackBar.open('Não foi possível recusar o convite.', 'OK', { duration: 4000 });
        },
      });
  }

  /** Marca a notificação do convite como lida localmente e atualiza a contagem. */
  private resolverConvite(n: Notificacao): void {
    this.respondendo.set(null);
    this.notificacoes.update((lista) =>
      lista.map((x) => (x.id === n.id ? { ...x, lida: true } : x)),
    );
    if (!n.lida) this.naoLidas.update((c) => Math.max(0, c - 1));
  }

  protected tempoRelativo(dataStr: string): string {
    const agora = Date.now();
    const data = new Date(dataStr).getTime();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin}min`;

    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `há ${diffHoras}h`;

    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias < 7) return `há ${diffDias}d`;

    return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  /**
   * Atualiza a contagem de não lidas. Quando `reagirANovas` é true (polling),
   * detecta chegada de novas notificações e atualiza a lista + avisa por toast.
   */
  private buscarContagem(reagirANovas = false): void {
    this.notificacoesService
      .contarNaoLidas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const anterior = this.naoLidas();
          this.naoLidas.set(res.count);

          if (reagirANovas && res.count > anterior) {
            const novas = res.count - anterior;
            // Se o dropdown está aberto, recarrega a lista para já mostrar.
            if (this.dropdownAberto()) {
              this.buscarNotificacoes();
            }
            this.snackBar.open(
              novas === 1 ? 'Você tem uma nova notificação' : `Você tem ${novas} novas notificações`,
              'Ver',
              { duration: 6000 },
            )
              .onAction()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.dropdownAberto.set(true);
                this.buscarNotificacoes();
              });
          }
        },
      });
  }

  private buscarNotificacoes(): void {
    this.carregando.set(true);
    this.notificacoesService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.notificacoes.set(lista);
          this.carregando.set(false);
        },
        error: () => this.carregando.set(false),
      });
  }

  private iniciarPolling(): void {
    this.pollingId = setInterval(() => this.buscarContagem(true), POLLING_INTERVAL_MS);

    this.destroyRef.onDestroy(() => {
      if (this.pollingId !== null) {
        clearInterval(this.pollingId);
      }
    });
  }
}
