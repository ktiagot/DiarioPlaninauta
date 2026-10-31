import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { bannerSrc } from '../../core/config/api.config';
import { ParceirosService } from '../../core/parceiros/parceiros.service';
import { Parceiro } from '../../core/parceiros/parceiros.models';

@Component({
  selector: 'app-parceiros',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './parceiros.html',
  styleUrl: './parceiros.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParceirosComponent implements OnInit {
  private readonly parceirosService = inject(ParceirosService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly parceiros = signal<Parceiro[]>([]);
  protected readonly logoSrc = bannerSrc;

  ngOnInit(): void {
    this.parceirosService.listarPublico().subscribe({
      next: (lista) => {
        this.parceiros.set(lista);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os parceiros.');
        this.loading.set(false);
      },
    });
  }

  /** Abre o link do parceiro e registra o clique (best-effort). */
  abrir(parceiro: Parceiro): void {
    this.parceirosService.registrarClique(parceiro.id).subscribe({
      next: () => {},
      error: () => {},
    });
    window.open(parceiro.url, '_blank', 'noopener,noreferrer');
  }
}
