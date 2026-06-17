import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PortalHeaderComponent } from '../shared/portal-header/portal-header';

@Component({
  selector: 'app-portal-layout',
  imports: [RouterOutlet, PortalHeaderComponent],
  template: `
    <div class="portal-layout">
      <app-portal-header />
      <main class="portal-layout__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .portal-layout {
      display: flex;
      min-height: 100vh;
      flex-direction: column;
    }

    .portal-layout__main {
      flex: 1;
      padding-top: 4rem;
    }
  `,
})
export class PortalLayoutComponent {}
