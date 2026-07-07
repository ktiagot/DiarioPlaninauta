import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { EliminacaoRegistro, Mesa, MesaJogador } from '../../../core/rodadas/rodadas.models';
import { RodadasService } from '../../../core/rodadas/rodadas.service';

@Component({
  selector: 'app-mesa-card',
  imports: [
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './mesa-card.html',
  styleUrl: './mesa-card.scss',
})
export class MesaCardComponent {
  private readonly rodadasService = inject(RodadasService);
  private readonly snackBar = inject(MatSnackBar);

  readonly mesa = input.required<Mesa>();
  readonly mesaAtualizada = output<Mesa>();

  protected readonly jogadoresOrdenados = signal<MesaJogador[]>([]);
  protected readonly linkPartidaInput = signal('');
  protected readonly linkPartidaSalvo = signal('');
  protected readonly finalizada = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly salvandoLink = signal(false);
  protected readonly eliminacoes = signal<EliminacaoRegistro[]>([]);
  protected readonly novoEliminadorId = signal<number | null>(null);
  protected readonly novoEliminadoId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const mesa = this.mesa();
      const link = mesa.linkPartida ?? '';

      this.jogadoresOrdenados.set([...mesa.jogadores]);
      this.linkPartidaInput.set(link);
      this.linkPartidaSalvo.set(link);
      this.finalizada.set(mesa.finalizada);
      this.eliminacoes.set(mesa.eliminacoes ? [...mesa.eliminacoes] : []);
      this.novoEliminadorId.set(null);
      this.novoEliminadoId.set(null);
    });
  }

  protected drop(event: CdkDragDrop<MesaJogador[]>): void {
    if (this.finalizada()) return;

    const jogadores = [...this.jogadoresOrdenados()];
    moveItemInArray(jogadores, event.previousIndex, event.currentIndex);
    this.jogadoresOrdenados.set(jogadores);
  }

  protected posicaoLabel(index: number, jogador: MesaJogador): string {
    if (index === 0) return '1º';
    if (index === 1) return '2º';
    if (jogador.rankingCampeonato != null) return `#${jogador.rankingCampeonato}`;
    return `${index + 1}º`;
  }

  protected displayNome(jogador: MesaJogador): string {
    return jogador.nickname ? `${jogador.nome} (${jogador.nickname})` : jogador.nome;
  }

  protected jogadorPorId(inscricaoId: number): MesaJogador | undefined {
    return this.jogadoresOrdenados().find((j) => j.inscricaoId === inscricaoId);
  }

  protected killCount(inscricaoId: number): number {
    return this.eliminacoes().filter((e) => e.eliminadorInscricaoId === inscricaoId).length;
  }

  protected killLabel(count: number): string {
    return count === 1 ? 'eliminação' : 'eliminações';
  }

  protected eliminadosIds(): number[] {
    return this.eliminacoes().map((e) => e.eliminadoInscricaoId);
  }

  protected jogadoresDisponiveisComoEliminado(): MesaJogador[] {
    const eliminados = new Set(this.eliminadosIds());
    const eliminadorId = this.novoEliminadorId();

    return this.jogadoresOrdenados().filter(
      (j) => !eliminados.has(j.inscricaoId) && j.inscricaoId !== eliminadorId,
    );
  }

  protected limiteEliminacoesAtingido(): boolean {
    return this.eliminacoes().length >= this.jogadoresOrdenados().length - 1;
  }

  protected podeAdicionarEliminacao(): boolean {
    const eliminadorId = this.novoEliminadorId();
    const eliminadoId = this.novoEliminadoId();

    if (eliminadorId == null || eliminadoId == null) return false;
    if (eliminadorId === eliminadoId) return false;
    if (this.limiteEliminacoesAtingido()) return false;
    if (this.eliminadosIds().includes(eliminadoId)) return false;

    return true;
  }

  protected adicionarEliminacao(): void {
    if (!this.podeAdicionarEliminacao()) return;

    this.eliminacoes.update((lista) => [
      ...lista,
      {
        eliminadorInscricaoId: this.novoEliminadorId()!,
        eliminadoInscricaoId: this.novoEliminadoId()!,
      },
    ]);

    this.novoEliminadoId.set(null);
  }

  protected removerEliminacao(index: number): void {
    if (this.finalizada()) return;
    this.eliminacoes.update((lista) => lista.filter((_, i) => i !== index));
  }

  protected onEliminadorChange(inscricaoId: number | null): void {
    this.novoEliminadorId.set(inscricaoId);
    if (inscricaoId != null && this.novoEliminadoId() === inscricaoId) {
      this.novoEliminadoId.set(null);
    }
  }

  protected podeEnviarLink(): boolean {
    if (this.finalizada() || this.salvandoLink()) return false;

    const normalized = this.rodadasService.normalizeLink(this.linkPartidaInput());
    return normalized.length > 0 && normalized !== this.linkPartidaSalvo();
  }

  protected enviarLink(): void {
    if (!this.podeEnviarLink()) return;

    const mesa = this.mesa();
    const link = this.rodadasService.normalizeLink(this.linkPartidaInput());

    this.salvandoLink.set(true);

    this.rodadasService
      .salvarLinkMesa(mesa.id, { linkPartida: link })
      .pipe(finalize(() => this.salvandoLink.set(false)))
      .subscribe((result) => {
        this.linkPartidaSalvo.set(link);
        this.linkPartidaInput.set(link);
        this.mesaAtualizada.emit({ ...mesa, linkPartida: link });

        const message =
          result === 'saved'
            ? 'Link da partida salvo com sucesso!'
            : 'Link salvo localmente — integração com API pendente.';

        this.snackBar.open(message, 'Fechar', { duration: 4000 });
      });
  }

  protected podeConfirmar(): boolean {
    return (
      !this.finalizada() &&
      this.jogadoresOrdenados().length === 4 &&
      this.eliminacoes().length === 3 &&
      !this.confirmando()
    );
  }

  protected confirmarPosicoes(): void {
    if (!this.podeConfirmar()) return;

    const mesa = this.mesa();
    const link = this.linkPartidaSalvo() || undefined;
    const eliminacoes = this.eliminacoes();
    const payload = {
      jogadores: this.jogadoresOrdenados().map((j, index) => ({
        inscricaoId: j.inscricaoId,
        posicao: index + 1,
        kills: this.killCount(j.inscricaoId),
      })),
      eliminacoes,
      linkPartida: link,
    };

    this.confirmando.set(true);

    const confirm$ = this.rodadasService.confirmarPosicoes(mesa.id, payload);

    confirm$
      .pipe(finalize(() => this.confirmando.set(false)))
      .subscribe((result) => {
        this.finalizada.set(true);
        this.mesaAtualizada.emit({
          ...mesa,
          finalizada: true,
          linkPartida: link || mesa.linkPartida,
          vencedorId: payload.jogadores[0]?.inscricaoId,
          segundoId: payload.jogadores[1]?.inscricaoId,
          eliminacoes,
          jogadores: this.jogadoresOrdenados().map((j) => ({
            ...j,
            kills: this.killCount(j.inscricaoId),
          })),
        });

        const message =
          result === 'saved'
            ? 'Posições confirmadas com sucesso!'
            : 'Posições salvas localmente — integração com API pendente.';

        this.snackBar.open(message, 'Fechar', { duration: 4000 });
      });
  }
}
