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

import { NotificacoesService } from '../../core/notificacoes/notificacoes.service';
import { Notificacao } from '../../core/notificacoes/notificacoes.models';

const POLLING_INTERVAL_MS = 60_000;

@Component({
  selector: 'app-notificacoes-sino',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './notificacoes-sino.html',
  styleUrl: './notificacoes-sino.scss',
})
export class NotificacoesSinoComponent implements OnInit {
  private readonly notificacoesService = inject(NotificacoesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  private pollingId: ReturnType<typeof setInterval> | null = null;

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

  private buscarContagem(): void {
    this.notificacoesService
      .contarNaoLidas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.naoLidas.set(res.count),
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
    this.pollingId = setInterval(() => this.buscarContagem(), POLLING_INTERVAL_MS);

    this.destroyRef.onDestroy(() => {
      if (this.pollingId !== null) {
        clearInterval(this.pollingId);
      }
    });
  }
}
