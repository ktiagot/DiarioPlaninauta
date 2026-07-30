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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { EliminacaoRegistro, Mesa, MesaJogador, Rodada } from '../../../core/rodadas/rodadas.models';
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
    MatSlideToggleModule,
  ],
  templateUrl: './mesa-card.html',
  styleUrl: './mesa-card.scss',
})
export class MesaCardComponent {
  private readonly rodadasService = inject(RodadasService);
  private readonly snackBar = inject(MatSnackBar);

  readonly mesa = input.required<Mesa>();
  readonly mesaAtualizada = output<Mesa>();
  readonly rodadaAtualizada = output<Rodada>();

  protected readonly jogadoresOrdenados = signal<MesaJogador[]>([]);
  protected readonly linkPartidaInput = signal('');
  protected readonly linkPartidaSalvo = signal('');
  protected readonly finalizada = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly salvandoLink = signal(false);
  protected readonly eliminacoes = signal<EliminacaoRegistro[]>([]);
  protected readonly novoEliminadorId = signal<string | null>(null);
  protected readonly novoEliminadoId = signal<string | null>(null);
  protected readonly resultadoEmpate = signal(false);
  protected readonly jogadoresEmpatados = signal<Record<string, boolean>>({});

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
      this.resultadoEmpate.set(mesa.empate === true);
      const empatadosMap: Record<string, boolean> = {};
      for (const id of mesa.empatadosInscricaoIds ?? []) {
        empatadosMap[id] = true;
      }
      this.jogadoresEmpatados.set(empatadosMap);
    });
  }

  protected drop(event: CdkDragDrop<MesaJogador[]>): void {
    if (this.finalizada() || this.resultadoEmpate()) return;

    const jogadores = [...this.jogadoresOrdenados()];
    moveItemInArray(jogadores, event.previousIndex, event.currentIndex);
    this.jogadoresOrdenados.set(jogadores);
  }

  protected onResultadoEmpateChange(value: boolean): void {
    this.resultadoEmpate.set(value);
    if (!value) {
      this.jogadoresEmpatados.set({});
    }
  }

  protected jogadorEmpatou(inscricaoId: string): boolean {
    return this.jogadoresEmpatados()[inscricaoId] ?? false;
  }

  protected setJogadorEmpatou(inscricaoId: string, value: boolean): void {
    this.jogadoresEmpatados.update((mapa) => ({ ...mapa, [inscricaoId]: value }));
  }

  protected isPrimeiroLugar(inscricaoId: string, index: number): boolean {
    if (this.resultadoEmpate()) {
      return this.jogadorEmpatou(inscricaoId);
    }
    return index === 0;
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

  protected jogadorPorId(inscricaoId: string): MesaJogador | undefined {
    return this.jogadoresOrdenados().find((j) => j.inscricaoId === inscricaoId);
  }

  protected killCount(inscricaoId: string): number {
    return this.eliminacoes().filter((e) => e.eliminadorInscricaoId === inscricaoId).length;
  }

  protected killLabel(count: number): string {
    return count === 1 ? 'eliminação' : 'eliminações';
  }

  protected eliminadosIds(): string[] {
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

  protected onEliminadorChange(inscricaoId: string | null): void {
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
      .subscribe({
        next: () => {
          this.linkPartidaSalvo.set(link);
          this.linkPartidaInput.set(link);
          this.mesaAtualizada.emit({ ...mesa, linkPartida: link });
          this.snackBar.open('Link da partida salvo com sucesso!', 'Fechar', {
            duration: 4000,
          });
        },
        error: (err: Error) => {
          this.snackBar.open(err.message || 'Erro ao salvar o link.', 'Fechar', {
            duration: 5000,
          });
        },
      });
  }

  protected podeConfirmar(): boolean {
    const total = this.jogadoresOrdenados().length;
    const killsNeeded = Math.max(total - 1, 0);
    const empateOk =
      !this.resultadoEmpate() ||
      Object.values(this.jogadoresEmpatados()).filter(Boolean).length >= 2;
    return (
      !this.finalizada() &&
      total >= 3 &&
      this.eliminacoes().length === killsNeeded &&
      empateOk &&
      !this.confirmando()
    );
  }

  protected confirmarPosicoes(): void {
    if (!this.podeConfirmar()) return;

    const mesa = this.mesa();
    const link = this.linkPartidaSalvo() || undefined;
    const empate = this.resultadoEmpate();
    const empatadosInscricaoIds = empate
      ? Object.entries(this.jogadoresEmpatados())
          .filter(([, marcado]) => marcado)
          .map(([id]) => id)
      : [];

    const payload = {
      jogadores: this.jogadoresOrdenados().map((j, index) => ({
        inscricaoId: j.inscricaoId,
        posicao: index + 1,
        kills: this.killCount(j.inscricaoId),
      })),
      empate,
      empatadosInscricaoIds,
      linkPartida: link,
    };

    this.confirmando.set(true);

    this.rodadasService
      .confirmarPosicoes(mesa.id, payload)
      .pipe(finalize(() => this.confirmando.set(false)))
      .subscribe({
        next: (rodada) => {
          this.finalizada.set(true);
          this.rodadaAtualizada.emit(rodada);
          this.snackBar.open('Posições confirmadas com sucesso!', 'Fechar', {
            duration: 4000,
          });
        },
        error: (err: Error) => {
          this.snackBar.open(err.message || 'Erro ao confirmar posições.', 'Fechar', {
            duration: 5000,
          });
        },
      });
  }
}
