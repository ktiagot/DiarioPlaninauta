import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { JogadorInscrito } from '../../../core/inscricoes/inscricoes.models';

@Component({
  selector: 'app-jogador-card',
  imports: [MatIconModule],
  templateUrl: './jogador-card.html',
  styleUrl: './jogador-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JogadorCardComponent {
  @Input({ required: true }) jogador!: JogadorInscrito;

  protected nomeExibicao(): string {
    const nome = (this.jogador.nome ?? '').toUpperCase();
    const nickname = this.jogador.nickname?.toUpperCase();
    if (nickname) {
      return nome ? `${nome} (${nickname})` : nickname;
    }
    return nome || 'Jogador';
  }
}
