import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Cabeçalho padrão das páginas: ícone (opcional), título e subtítulo centralizados.
 * Conteúdo projetado (ng-content) aparece abaixo, para ações/avisos da página.
 */
@Component({
  selector: 'app-page-header',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <h1 class="page-header__title">
        @if (icone()) {
          <mat-icon class="page-header__icon" fontSet="material-icons-outlined" aria-hidden="true">
            {{ icone() }}
          </mat-icon>
        }
        {{ titulo() }}
      </h1>
      @if (subtitulo()) {
        <p class="page-header__subtitle">{{ subtitulo() }}</p>
      }
      <div class="page-header__extra"><ng-content /></div>
    </header>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .page-header {
      text-align: center;
    }

    .page-header__title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.2;
      color: var(--sys-color-white, #fff);
    }

    .page-header__icon {
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      font-size: 1.75rem;
      color: var(--sys-color-primary, #f58220);
    }

    .page-header__subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.9375rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .page-header__extra {
      display: flex;
      justify-content: center;
      margin-top: 0.75rem;
    }

    .page-header__extra:empty {
      display: none;
    }
  `,
})
export class PageHeaderComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | null>(null);
  /** Nome do ícone Material (estilo outlined). */
  readonly icone = input<string | null>(null);
}
