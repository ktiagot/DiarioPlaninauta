import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

import { LojaService } from '../../core/loja/loja.service';
import { SessionService } from '../../core/auth/session.service';
import { Produto } from '../../core/loja/loja.models';

@Component({
  selector: 'app-loja',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
  ],
  templateUrl: './loja.html',
  styleUrl: './loja.scss',
})
export class LojaComponent implements OnInit {
  private readonly lojaService = inject(LojaService);
  private readonly session = inject(SessionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly produtos = signal<Produto[]>([]);
  readonly saldo = signal(0);
  readonly resgatando = signal<string | null>(null);

  readonly isLoggedIn = computed(() => this.session.isAuthenticated());

  ngOnInit(): void {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.lojaService.listarProdutos().subscribe({
      next: (produtos) => {
        this.produtos.set(produtos);
        this.carregarSaldo();
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  private carregarSaldo(): void {
    if (!this.isLoggedIn()) {
      this.loading.set(false);
      return;
    }

    this.lojaService.obterSaldo().subscribe({
      next: (data) => {
        this.saldo.set(data.saldo);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  podeResgatar(produto: Produto): boolean {
    if (this.saldo() < produto.precoPontos) return false;
    if (produto.estoque !== null && produto.estoque <= 0) return false;
    return true;
  }

  resgatar(produto: Produto): void {
    if (!this.podeResgatar(produto)) return;

    const confirmado = confirm(
      `Deseja resgatar "${produto.nome}" por ${produto.precoPontos} pontos?`,
    );
    if (!confirmado) return;

    this.resgatando.set(produto.id);

    this.lojaService.resgatar(produto.id).subscribe({
      next: () => {
        this.resgatando.set(null);
        this.saldo.update((s) => s - produto.precoPontos);
        if (produto.estoque !== null) {
          this.produtos.update((prods) =>
            prods.map((p) =>
              p.id === produto.id ? { ...p, estoque: (p.estoque ?? 1) - 1 } : p,
            ),
          );
        }
        alert('Resgate realizado com sucesso! Aguarde a aprovação.');
      },
      error: (err: Error) => {
        this.resgatando.set(null);
        alert(err.message || 'Erro ao resgatar. Tente novamente.');
      },
    });
  }
}
