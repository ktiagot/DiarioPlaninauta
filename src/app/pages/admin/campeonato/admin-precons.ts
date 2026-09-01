import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PreconAdmin } from '../../../core/precons/precons.models';
import { PreconsService } from '../../../core/precons/precons.service';

interface PreconDraft {
  nome: string;
  setNome: string;
  ano: number;
  comandantes: string[];
}

@Component({
  selector: 'app-admin-precons',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-precons.html',
  styleUrl: './admin-precons.scss',
})
export class AdminPreconsComponent implements OnInit {
  private readonly preconsService = inject(PreconsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly precons = signal<PreconAdmin[]>([]);
  readonly loading = signal(true);
  readonly savingId = signal<string | null>(null);
  readonly syncing = signal(false);

  readonly editDrafts = signal<Record<string, PreconDraft>>({});

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.preconsService.listAdmin().subscribe({
      next: (list) => {
        this.precons.set(list);
        this.syncDrafts(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message || 'Erro ao carregar precons.', 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  sincronizar(): void {
    if (this.syncing()) return;
    if (
      !window.confirm(
        'Buscar precons oficiais da lista pública e atualizar o cadastro? Precons existentes (por nome + set) são atualizados; novos são adicionados. Nada é removido.',
      )
    ) {
      return;
    }

    this.syncing.set(true);
    this.preconsService
      .sync()
      .pipe(finalize(() => this.syncing.set(false)))
      .subscribe({
        next: (res) => {
          const falhasMsg = res.falhas > 0 ? ` ${res.falhas} falha(s).` : '';
          this.snackBar.open(
            `Sincronizado: ${res.criados} novo(s), ${res.atualizados} atualizado(s), total ${res.total}.${falhasMsg}`,
            'OK',
            { duration: 7000 },
          );
          this.carregar();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Erro ao sincronizar precons.', 'Fechar', {
            duration: 6000,
          });
        },
      });
  }

  draftFor(p: PreconAdmin): PreconDraft {
    return (
      this.editDrafts()[p.id] ?? {
        nome: p.nome,
        setNome: p.setNome,
        ano: p.ano,
        comandantes: p.comandantes.map((c) => c.comandante),
      }
    );
  }

  updateDraft(p: PreconAdmin, field: keyof PreconDraft, value: string | number): void {
    this.editDrafts.update((drafts) => {
      const current = drafts[p.id] ?? this.draftFor(p);
      return { ...drafts, [p.id]: { ...current, [field]: value } };
    });
  }

  salvar(p: PreconAdmin): void {
    if (this.savingId() === p.id) return;

    const draft = this.draftFor(p);
    this.savingId.set(p.id);
    this.preconsService
      .update(p.id, {
        nome: draft.nome.trim(),
        setNome: draft.setNome.trim(),
        ano: draft.ano,
      })
      .pipe(finalize(() => this.savingId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Precon atualizado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Erro ao salvar.', 'Fechar', { duration: 5000 });
        },
      });
  }

  toggleBanido(p: PreconAdmin): void {
    if (this.savingId() === p.id) return;
    this.savingId.set(p.id);
    this.preconsService
      .update(p.id, { banido: !p.banido })
      .pipe(finalize(() => this.savingId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open(p.banido ? 'Precon reativado.' : 'Precon banido.', 'Fechar', {
            duration: 3000,
          });
          this.carregar();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Erro.', 'Fechar', { duration: 5000 });
        },
      });
  }

  private syncDrafts(list: PreconAdmin[]): void {
    const drafts: Record<string, PreconDraft> = {};
    for (const p of list) {
      drafts[p.id] = {
        nome: p.nome,
        setNome: p.setNome,
        ano: p.ano,
        comandantes: p.comandantes.map((c) => c.comandante),
      };
    }
    this.editDrafts.set(drafts);
  }
}
