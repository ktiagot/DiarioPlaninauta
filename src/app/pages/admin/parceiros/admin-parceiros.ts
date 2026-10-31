import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ParceirosService } from '../../../core/parceiros/parceiros.service';
import { Parceiro } from '../../../core/parceiros/parceiros.models';

@Component({
  selector: 'app-admin-parceiros',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-parceiros.html',
  styleUrl: './admin-parceiros.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminParceirosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly parceirosService = inject(ParceirosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly salvando = signal(false);
  protected readonly parceiros = signal<Parceiro[]>([]);
  /** id em edição, ou null quando criando um novo. */
  protected readonly editandoId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    url: ['', [Validators.required]],
    descricao: [''],
    logoUrl: [''],
    ordem: [0, [Validators.required, Validators.min(0)]],
    ativo: [true],
  });

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.loading.set(true);
    this.parceirosService.listarAdmin().subscribe({
      next: (lista) => {
        this.parceiros.set(lista);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar parceiros.', 'OK', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  editar(p: Parceiro): void {
    this.editandoId.set(p.id);
    this.form.setValue({
      nome: p.nome,
      url: p.url,
      descricao: p.descricao ?? '',
      logoUrl: p.logoUrl ?? '',
      ordem: p.ordem,
      ativo: p.ativo,
    });
  }

  cancelarEdicao(): void {
    this.editandoId.set(null);
    this.form.reset({ nome: '', url: '', descricao: '', logoUrl: '', ordem: 0, ativo: true });
  }

  salvar(): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      nome: raw.nome.trim(),
      url: raw.url.trim(),
      descricao: raw.descricao.trim() || undefined,
      logoUrl: raw.logoUrl.trim() || undefined,
      ordem: raw.ordem,
      ativo: raw.ativo,
    };

    const id = this.editandoId();
    const req = id
      ? this.parceirosService.atualizar(id, payload)
      : this.parceirosService.criar(payload);

    req.subscribe({
      next: () => {
        this.salvando.set(false);
        this.snackBar.open(id ? 'Parceiro atualizado.' : 'Parceiro criado.', 'OK', {
          duration: 3000,
        });
        this.cancelarEdicao();
        this.carregar();
      },
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        const msg =
          (typeof err.error?.message === 'string' && err.error.message) ||
          (Array.isArray(err.error?.message) && err.error.message[0]) ||
          'Não foi possível salvar o parceiro.';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
      },
    });
  }

  remover(p: Parceiro): void {
    if (!confirm(`Remover o parceiro "${p.nome}"?`)) return;

    this.parceirosService.remover(p.id).subscribe({
      next: () => {
        this.snackBar.open('Parceiro removido.', 'OK', { duration: 3000 });
        if (this.editandoId() === p.id) this.cancelarEdicao();
        this.carregar();
      },
      error: () => this.snackBar.open('Erro ao remover.', 'OK', { duration: 4000 }),
    });
  }
}
