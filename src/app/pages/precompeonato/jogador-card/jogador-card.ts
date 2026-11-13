import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faClone } from '@fortawesome/free-solid-svg-icons';

import { JogadorInscrito } from '../../../core/inscricoes/inscricoes.models';

@Component({
  selector: 'app-jogador-card',
  imports: [MatTooltipModule, FaIconComponent],
  templateUrl: './jogador-card.html',
  styleUrl: './jogador-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JogadorCardComponent {
  @Input({ required: true }) jogador!: JogadorInscrito;

  protected readonly faDeck = faClone;

  protected nomeExibicao(): string {
    const nome = (this.jogador.nome ?? '').toUpperCase();
    const nickname = this.jogador.nickname?.toUpperCase();
    if (nickname) {
      return nome ? `${nome} (${nickname})` : nickname;
    }
    return nome || 'Jogador';
  }
}
