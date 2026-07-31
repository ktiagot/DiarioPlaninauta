import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SugestoesService } from '../../core/sugestoes/sugestoes.service';
import { PortalBrandComponent } from '../../shared/portal-brand/portal-brand';

@Component({
  selector: 'app-sugestoes',
  imports: [
    ReactiveFormsModule,
    PortalBrandComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sugestoes.html',
  styleUrl: './sugestoes.scss',
})
export class SugestoesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sugestoesService = inject(SugestoesService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly enviado = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    telefone: [''],
    mensagem: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = this.form.getRawValue();

    this.sugestoesService.enviar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.enviado.set(true);
        this.snackBar.open('Sugestão enviada com sucesso!', 'OK', { duration: 5000 });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao enviar sugestão. Tente novamente.', 'OK', { duration: 5000 });
      },
    });
  }

  novasugestao(): void {
    this.form.reset();
    this.enviado.set(false);
  }
}
