import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsersService } from '../../core/users/users.service';
import { User } from '../../core/users/users.models';
import { LocalidadeService } from '../../core/localidade/localidade.service';
import { LocalidadeSugestao } from '../../core/localidade/localidade.models';
import { ScryfallService } from '../../core/scryfall/scryfall.service';

const FORMATOS_DISPONIVEIS = [
  'Standard',
  'Pioneer',
  'Modern',
  'Legacy',
  'Vintage',
  'Commander',
  'Pauper',
  'Limited',
  'Draft',
  'Sealed',
];

const DIAS_SEMANA = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

@Component({
  selector: 'app-perfil-editar',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './perfil-editar.html',
  styleUrl: './perfil-editar.scss',
})
export class PerfilEditarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly localidadeService = inject(LocalidadeService);
  private readonly scryfallService = inject(ScryfallService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly formatosDisponiveis = FORMATOS_DISPONIVEIS;
  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly sugestoesCidade = signal<LocalidadeSugestao[]>([]);
  protected readonly avatarResults = signal<{ name: string; artCropUrl: string }[]>([]);
  protected readonly avatarSearchTerm = signal('');

  private cidadeSelecionada: LocalidadeSugestao | null = null;
  private buscaCidadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private buscaAvatarTimeout: ReturnType<typeof setTimeout> | null = null;
  private userId = '';

  protected readonly form = this.fb.nonNullable.group({
    nome: [''],
    sobrenome: [''],
    nick: [''],
    telefone: [''],
    cidade: [''],
    formatos: [[] as string[]],
    formatoFavorito: [''],
    diasDisponiveis: [[] as string[]],
    horariosText: [''],
    genero: [''],
    foto: [''],
  });

  ngOnInit(): void {
    this.userId = localStorage.getItem('user_id') ?? '';
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.usersService.findById(this.userId).subscribe({
      next: (user) => {
        this.populateForm(user);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar perfil.', 'OK', { duration: 5000 });
        this.router.navigate(['/']);
      },
    });
  }

  private populateForm(user: User): void {
    this.form.patchValue({
      nome: user.nome ?? '',
      sobrenome: user.sobrenome ?? '',
      nick: user.nick ?? '',
      telefone: user.telefone ?? '',
      cidade: user.cidade ?? '',
      formatos: user.formatos ?? [],
      formatoFavorito: user.formatoFavorito ?? '',
      diasDisponiveis: user.diasDisponiveis ?? [],
      horariosText: (user.horarios ?? []).join(', '),
      genero: user.genero ?? '',
      foto: user.foto ?? '',
    });
  }

  // ── Cidade (Nominatim) ──────────────────────────────────────
  onCidadeBusca(event: Event): void {
    const termo = (event.target as HTMLInputElement).value.trim();
    this.cidadeSelecionada = null;

    if (this.buscaCidadeTimeout) clearTimeout(this.buscaCidadeTimeout);

    if (termo.length < 3) {
      this.sugestoesCidade.set([]);
      return;
    }

    this.buscaCidadeTimeout = setTimeout(() => {
      this.localidadeService.buscar(termo).subscribe((resultados) => {
        this.sugestoesCidade.set(resultados);
      });
    }, 400);
  }

  selecionarCidade(sugestao: LocalidadeSugestao): void {
    this.cidadeSelecionada = sugestao;
    this.form.controls.cidade.setValue(sugestao.displayName);
    this.sugestoesCidade.set([]);
  }

  // ── Avatar (Scryfall) ──────────────────────────────────────
  onAvatarSearch(event: Event): void {
    const termo = (event.target as HTMLInputElement).value.trim();
    this.avatarSearchTerm.set(termo);

    if (this.buscaAvatarTimeout) clearTimeout(this.buscaAvatarTimeout);

    if (termo.length < 2) {
      this.avatarResults.set([]);
      return;
    }

    this.buscaAvatarTimeout = setTimeout(() => {
      this.scryfallService.buscarLendarias(termo).subscribe((cards) => {
        this.avatarResults.set(cards);
      });
    }, 500);
  }

  selectAvatar(card: { name: string; artCropUrl: string }): void {
    this.form.controls.foto.setValue(card.artCropUrl);
    this.avatarResults.set([]);
    this.avatarSearchTerm.set(card.name);
  }

  // ── Submit ──────────────────────────────────────────────────
  submit(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const horarios = raw.horariosText
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      nome: raw.nome || undefined,
      sobrenome: raw.sobrenome || undefined,
      nick: raw.nick || undefined,
      telefone: raw.telefone || undefined,
      cidade: this.cidadeSelecionada?.cidade ?? raw.cidade || undefined,
      estado: this.cidadeSelecionada?.estado ?? undefined,
      pais: this.cidadeSelecionada?.pais ?? undefined,
      lat: this.cidadeSelecionada?.lat ?? undefined,
      lng: this.cidadeSelecionada?.lng ?? undefined,
      formatos: raw.formatos.length ? raw.formatos : undefined,
      formatoFavorito: raw.formatoFavorito || undefined,
      diasDisponiveis: raw.diasDisponiveis.length ? raw.diasDisponiveis : undefined,
      horarios: horarios.length ? horarios : undefined,
      genero: raw.genero || undefined,
      foto: raw.foto || undefined,
    };

    // Remove undefined keys
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    );

    this.usersService.update(this.userId, cleanPayload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Perfil atualizado!', 'OK', { duration: 4000 });
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const message =
          typeof err.error?.message === 'string'
            ? err.error.message
            : Array.isArray(err.error?.message)
              ? err.error.message.join(' ')
              : 'Erro ao salvar perfil.';
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }
}
