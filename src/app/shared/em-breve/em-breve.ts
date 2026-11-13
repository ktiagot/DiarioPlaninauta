import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Aviso padrão de funcionalidade "em breve" (substitui o conteúdo da página). */
@Component({
  selector: 'app-em-breve',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="em-breve" role="status">
      <mat-icon class="em-breve__icon" fontSet="material-icons-outlined" aria-hidden="true">
        {{ icone() }}
      </mat-icon>
      <h2 class="em-breve__titulo">Em breve</h2>
      <p class="em-breve__mensagem">{{ mensagem() }}</p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .em-breve {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.75rem;
      padding: 4rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
    }

    .em-breve__icon {
      width: 4rem;
      height: 4rem;
      font-size: 4rem;
      color: var(--sys-color-primary, #f58220);
      opacity: 0.85;
    }

    .em-breve__titulo {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
    }

    .em-breve__mensagem {
      margin: 0;
      max-width: 24rem;
      color: rgba(255, 255, 255, 0.7);
    }
  `,
})
export class EmBreveComponent {
  readonly icone = input('hourglass_empty');
  readonly mensagem = input('Esta área ainda está em preparação. Volte mais tarde!');
}
