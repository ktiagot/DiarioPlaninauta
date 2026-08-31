import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  readonly saving = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly syncing = signal(false);

  readonly formNome = signal('');
  readonly formSetNome = signal('');
  readonly formAno = signal(new Date().getFullYear());
  readonly formComandantes = signal<string[]>(['']);

  readonly editDrafts = signal<Record<string, PreconDraft>>({});

  readonly podeCriar = computed(() => {
    const cmds = this.formComandantes().map((c) => c.trim()).filter(Boolean);
    return (
      this.formNome().trim() &&
      this.formSetNome().trim() &&
      this.formAno() >= 1993 &&
      cmds.length > 0
    );
  });

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
          this.snackBar.open(
            `Sincronizado: ${res.criados} novo(s), ${res.atualizados} atualizado(s). Total: ${res.total}.`,
            'OK',
            { duration: 6000 },
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

  updateDraftComandante(p: PreconAdmin, index: number, value: string): void {
    this.editDrafts.update((drafts) => {
      const current = { ...(drafts[p.id] ?? this.draftFor(p)) };
      const cmds = [...current.comandantes];
      cmds[index] = value;
      return { ...drafts, [p.id]: { ...current, comandantes: cmds } };
    });
  }

  addDraftComandante(p: PreconAdmin): void {
    this.editDrafts.update((drafts) => {
      const current = drafts[p.id] ?? this.draftFor(p);
      return {
        ...drafts,
        [p.id]: { ...current, comandantes: [...current.comandantes, ''] },
      };
    });
  }

  removeDraftComandante(p: PreconAdmin, index: number): void {
    this.editDrafts.update((drafts) => {
      const current = drafts[p.id] ?? this.draftFor(p);
      const cmds = current.comandantes.filter((_, i) => i !== index);
      return { ...drafts, [p.id]: { ...current, comandantes: cmds.length ? cmds : [''] } };
    });
  }

  addFormComandante(): void {
    this.formComandantes.update((list) => [...list, '']);
  }

  removeFormComandante(index: number): void {
    this.formComandantes.update((list) => {
      const next = list.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });
  }

  updateFormComandante(index: number, value: string): void {
    this.formComandantes.update((list) => {
      const next = [...list];
      next[index] = value;
      return next;
    });
  }

  criar(): void {
    if (!this.podeCriar() || this.saving()) return;

    const comandantes = this.formComandantes().map((c) => c.trim()).filter(Boolean);
    this.saving.set(true);

    this.preconsService
      .create({
        nome: this.formNome().trim(),
        setNome: this.formSetNome().trim(),
        ano: this.formAno(),
        comandantes,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.formNome.set('');
          this.formSetNome.set('');
          this.formAno.set(new Date().getFullYear());
          this.formComandantes.set(['']);
          this.snackBar.open('Precon cadastrado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Erro ao cadastrar.', 'Fechar', {
            duration: 5000,
          });
        },
      });
  }

  salvar(p: PreconAdmin): void {
    if (this.savingId() === p.id) return;

    const draft = this.draftFor(p);
    const comandantes = draft.comandantes.map((c) => c.trim()).filter(Boolean);
    if (!comandantes.length) {
      this.snackBar.open('Informe ao menos um comandante.', 'Fechar', { duration: 4000 });
      return;
    }

    this.savingId.set(p.id);
    this.preconsService
      .update(p.id, {
        nome: draft.nome.trim(),
        setNome: draft.setNome.trim(),
        ano: draft.ano,
        comandantes,
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

  excluir(p: PreconAdmin): void {
    if (
      !window.confirm(
        `Excluir "${p.nome}"? Só é possível se não houver inscrições ou mesas vinculadas.`,
      )
    ) {
      return;
    }

    this.deletingId.set(p.id);
    this.preconsService
      .remove(p.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Precon excluído.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Erro ao excluir.', 'Fechar', { duration: 5000 });
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
