import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, of, switchMap } from 'rxjs';

import { AdminService } from '../../../core/admin/admin.service';
import { CampeonatoAdmin, CreateCampeonatoPayload } from '../../../core/admin/admin.models';
import { bannerSrc } from '../../../core/config/api.config';

interface CampeonatoDraft {
  nome: string;
  edicao: string;
  dataInicio: string;
  descricao: string;
}

@Component({
  selector: 'app-admin-campeonatos',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-campeonatos.html',
  styleUrl: './admin-campeonatos.scss',
})
export class AdminCampeonatosComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly campeonatos = signal<CampeonatoAdmin[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly uploadingBannerId = signal<string | null>(null);
  readonly updatingStatusId = signal<string | null>(null);

  readonly formNome = signal('');
  readonly formEdicao = signal('');
  readonly formDataInicio = signal('');
  readonly formDescricao = signal('');
  readonly formBannerFile = signal<File | null>(null);

  readonly editDrafts = signal<Record<string, CampeonatoDraft>>({});

  readonly podeCriar = computed(
    () => !this.campeonatos().some((c) => c.statusCode !== 'ENCERRADO'),
  );

  protected readonly bannerSrc = bannerSrc;

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.adminService.listCampeonatos().subscribe({
      next: (list) => {
        this.campeonatos.set(list);
        this.syncDrafts(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message || 'Erro.', 'Fechar', { duration: 5000 });
      },
    });
  }

  draftFor(c: CampeonatoAdmin): CampeonatoDraft {
    return (
      this.editDrafts()[c.id] ?? {
        nome: c.nome,
        edicao: c.edicao,
        dataInicio: c.dataInicio,
        descricao: c.descricao ?? '',
      }
    );
  }

  updateDraft(c: CampeonatoAdmin, field: keyof CampeonatoDraft, value: string): void {
    this.editDrafts.update((drafts) => {
      const current = drafts[c.id] ?? {
        nome: c.nome,
        edicao: c.edicao,
        dataInicio: c.dataInicio,
        descricao: c.descricao ?? '',
      };
      return {
        ...drafts,
        [c.id]: { ...current, [field]: value },
      };
    });
  }

  onCreateBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formBannerFile.set(input.files?.[0] ?? null);
  }

  onEditBannerSelected(c: CampeonatoAdmin, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingBannerId.set(c.id);
    this.adminService
      .uploadCampeonatoBanner(c.id, file)
      .pipe(finalize(() => this.uploadingBannerId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Banner atualizado.', 'OK', { duration: 3000 });
          this.carregar();
        },
        error: (err) => this.handleError(err),
      });
  }

  criar(): void {
    if (!this.podeCriar() || this.saving()) return;

    const nome = this.formNome().trim();
    const edicao = this.formEdicao().trim();
    const dataInicio = this.formDataInicio().trim();
    const descricao = this.formDescricao().trim();

    if (!nome || !edicao || !dataInicio) {
      this.snackBar.open('Preencha nome, edição e data de início.', 'Fechar', { duration: 4000 });
      return;
    }

    const payload: CreateCampeonatoPayload = { nome, edicao, dataInicio };
    if (descricao) payload.descricao = descricao;

    this.saving.set(true);
    this.adminService
      .createCampeonato(payload)
      .pipe(
        switchMap((created) => {
          const file = this.formBannerFile();
          if (file) {
            return this.adminService.uploadCampeonatoBanner(created.id, file);
          }
          return of(created);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Campeonato criado.', 'OK', { duration: 3000 });
          this.limparForm();
          this.carregar();
        },
        error: (err) => this.handleError(err),
      });
  }

  salvar(c: CampeonatoAdmin): void {
    if (c.statusCode === 'ENCERRADO' || this.savingId() === c.id) return;

    const draft = this.draftFor(c);
    const payload: Partial<CreateCampeonatoPayload> = {
      nome: draft.nome.trim(),
      edicao: draft.edicao.trim(),
      dataInicio: draft.dataInicio.trim(),
      descricao: draft.descricao.trim() || undefined,
    };

    if (!payload.nome || !payload.edicao || !payload.dataInicio) {
      this.snackBar.open('Preencha nome, edição e data de início.', 'Fechar', { duration: 4000 });
      return;
    }

    this.savingId.set(c.id);
    this.adminService
      .updateCampeonato(c.id, payload)
      .pipe(finalize(() => this.savingId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Campeonato atualizado.', 'OK', { duration: 3000 });
          this.carregar();
        },
        error: (err) => this.handleError(err),
      });
  }

  iniciar(c: CampeonatoAdmin): void {
    this.alterarStatus(c, 'EM_ANDAMENTO');
  }

  reabrirInscricoes(c: CampeonatoAdmin): void {
    this.alterarStatus(c, 'INSCRICOES_ABERTAS');
  }

  finalizar(c: CampeonatoAdmin): void {
    const ok = window.confirm(
      'Encerra o campeonato; só então será possível criar o próximo.',
    );
    if (!ok) return;
    this.alterarStatus(c, 'ENCERRADO');
  }

  statusBadgeClass(statusCode: CampeonatoAdmin['statusCode']): string {
    if (statusCode === 'ENCERRADO') return 'badge badge--done';
    if (statusCode === 'EM_ANDAMENTO') return 'badge badge--active';
    return 'badge';
  }

  formatDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  private alterarStatus(c: CampeonatoAdmin, status: CampeonatoAdmin['statusCode']): void {
    if (this.updatingStatusId()) return;

    this.updatingStatusId.set(c.id);
    this.adminService
      .updateCampeonatoStatus(c.id, status)
      .pipe(finalize(() => this.updatingStatusId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'OK', { duration: 3000 });
          this.carregar();
        },
        error: (err) => {
          if (err?.status === 409) {
            this.carregar();
          }
          this.handleError(err);
        },
      });
  }

  private syncDrafts(list: CampeonatoAdmin[]): void {
    const drafts: Record<string, CampeonatoDraft> = {};
    for (const c of list) {
      if (c.statusCode !== 'ENCERRADO') {
        drafts[c.id] = {
          nome: c.nome,
          edicao: c.edicao,
          dataInicio: c.dataInicio,
          descricao: c.descricao ?? '',
        };
      }
    }
    this.editDrafts.set(drafts);
  }

  private limparForm(): void {
    this.formNome.set('');
    this.formEdicao.set('');
    this.formDataInicio.set('');
    this.formDescricao.set('');
    this.formBannerFile.set(null);
  }

  private handleError(err: { status?: number; error?: { message?: string } }): void {
    this.snackBar.open(err?.error?.message || 'Erro.', 'Fechar', { duration: 5000 });
  }
}
