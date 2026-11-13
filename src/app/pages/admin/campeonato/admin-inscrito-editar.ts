import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { AdminService } from '../../../core/admin/admin.service';
import { AjustePontos, InscritoResumo, UpdateInscricaoPayload } from '../../../core/admin/admin.models';
import { GrupoCampeonato } from '../../../core/inscricoes/inscricoes.models';
import { InscricoesService } from '../../../core/inscricoes/inscricoes.service';
import { PreconAdmin, PreconComandante } from '../../../core/precons/precons.models';
import { PreconsService } from '../../../core/precons/precons.service';

@Component({
  selector: 'app-admin-inscrito-editar',
  imports: [DatePipe, FormsModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './admin-inscrito-editar.html',
  styleUrl: './admin-inscrito-editar.scss',
})
export class AdminInscritoEditarComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly inscricoesService = inject(InscricoesService);
  private readonly preconsService = inject(PreconsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly inscrito = input.required<InscritoResumo>();
  readonly salvo = output<void>();
  readonly fechar = output<void>();

  protected readonly grupos = signal<GrupoCampeonato[]>([]);
  protected readonly precons = signal<PreconAdmin[]>([]);
  protected readonly comandantes = signal<PreconComandante[]>([]);
  protected readonly ajustes = signal<AjustePontos[]>([]);
  protected readonly saving = signal(false);

  /** '' = manter; '__none__' = remover grupo. */
  protected grupoId = '';
  protected discordNick = '';
  protected deckUrl = '';
  protected preconId = '';
  protected comandanteId = '';
  protected comandante2Id = '';

  ngOnInit(): void {
    this.inscricoesService.getGruposAtual().subscribe((g) => this.grupos.set(g));
    this.preconsService.listAdmin().subscribe((p) => this.precons.set(p));
    this.adminService
      .listarAjustes(this.inscrito().id)
      .subscribe({ next: (a) => this.ajustes.set(a) });
  }

  protected onPreconChange(id: string): void {
    this.preconId = id;
    this.comandanteId = '';
    this.comandante2Id = '';
    this.comandantes.set([]);
    if (id) {
      this.comandantes.set(this.precons().find((p) => p.id === id)?.comandantes ?? []);
    }
  }

  protected salvar(): void {
    const payload: UpdateInscricaoPayload = {};
    if (this.grupoId === '__none__') payload.grupoId = null;
    else if (this.grupoId) payload.grupoId = this.grupoId;
    if (this.discordNick.trim()) payload.discordNick = this.discordNick.trim();
    if (this.deckUrl.trim()) payload.deckUrl = this.deckUrl.trim();

    if (this.preconId) {
      if (!this.comandanteId) {
        this.snackBar.open('Escolha o comandante do novo precon.', 'Fechar', { duration: 4000 });
        return;
      }
      payload.preconId = this.preconId;
      payload.preconComandanteId = this.comandanteId;
      payload.preconComandante2Id = this.comandante2Id || null;
    }

    if (Object.keys(payload).length === 0) {
      this.snackBar.open('Nada para salvar.', 'Fechar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    this.adminService
      .atualizarInscricao(this.inscrito().id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Inscrição atualizada.', 'OK', { duration: 3000 });
          this.salvo.emit();
        },
        error: (err) => {
          const m = err?.error?.message;
          this.snackBar.open((Array.isArray(m) ? m[0] : m) || 'Erro.', 'Fechar', { duration: 5000 });
        },
      });
  }
}
