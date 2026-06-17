import { Component, input } from '@angular/core';

import { PORTAL_LOGO_URL } from './portal-brand.constants';

@Component({
  selector: 'app-portal-brand',
  template: `
    <div class="portal-brand" [class.portal-brand--toolbar]="variant() === 'toolbar'">
      <img
        [src]="logoUrl"
        alt="Diário Planinauta"
        class="portal-brand__logo"
      />
    </div>
  `,
  styles: `
    .portal-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .portal-brand__logo {
      display: block;
      width: auto;
      max-width: 16rem;
      height: 3.5rem;
      object-fit: contain;
    }

    .portal-brand__subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
    }

    .portal-brand--toolbar {
      flex-direction: row;
      align-items: center;
    }

    .portal-brand--toolbar .portal-brand__logo {
      max-width: none;
      height: 2rem;
    }
  `,
})
export class PortalBrandComponent {
  readonly logoUrl = PORTAL_LOGO_URL;
  readonly variant = input<'default' | 'toolbar'>('default');
  readonly showSubtitle = input(true);
}
