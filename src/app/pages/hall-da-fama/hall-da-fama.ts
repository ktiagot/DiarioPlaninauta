import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HallDaFamaService } from '../../core/hall-da-fama/hall-da-fama.service';
import { HallDaFamaEntry } from '../../core/hall-da-fama/hall-da-fama.models';

@Component({
  selector: 'app-hall-da-fama',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './hall-da-fama.html',
  styleUrl: './hall-da-fama.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HallDaFamaComponent implements OnInit {
  private readonly hallService = inject(HallDaFamaService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly entradas = signal<HallDaFamaEntry[]>([]);

  ngOnInit(): void {
    this.hallService.listar().subscribe({
      next: (lista) => {
        this.entradas.set(lista);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o Hall da Fama.');
        this.loading.set(false);
      },
    });
  }

  /** Imagem da arte do comandante (Scryfall), usada como destaque do card. */
  protected artUrl(comandante: string | null): string | null {
    if (!comandante) return null;
    return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(comandante)}&format=image&version=art_crop`;
  }
}
