import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-page-placeholder',
  imports: [MatCardModule],
  template: `
    <div class="flex flex-col items-center p-6">
      <mat-card class="w-full max-w-3xl">
        <mat-card-header>
          <mat-card-title>{{ title() }}</mat-card-title>
          <mat-card-subtitle>Em breve</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="pt-4">
          <p class="text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            Esta seção está em desenvolvimento.
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class PagePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string) ?? 'Página')),
    { initialValue: 'Página' },
  );
}
