import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { JogadorInscrito } from '../../../core/inscricoes/inscricoes.models';

@Component({
  selector: 'app-jogador-card',
  imports: [MatIconModule],
  templateUrl: './jogador-card.html',
  styleUrl: './jogador-card.scss',
})
export class JogadorCardComponent {
  @Input({ required: true }) jogador!: JogadorInscrito;

  protected nomeExibicao(): string {
    const nome = this.jogador.nome.toUpperCase();
    if (this.jogador.nickname) {
      return `${nome} (${this.jogador.nickname.toUpperCase()})`;
    }
    return nome;
  }
}
