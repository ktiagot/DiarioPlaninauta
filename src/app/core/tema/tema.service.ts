import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

import { API_URL } from '../config/api.config';
import { Tema, TEMA_PADRAO } from './tema.models';

/** Variáveis CSS de tema que podem ser sobrescritas pelo tema personalizado. */
const VARS_TEMA = [
  '--sys-color-primary',
  '--sys-color-primary-strong',
  '--sys-color-on-primary',
  '--sys-color-bg',
  '--sys-color-text',
  '--sys-color-surface',
  '--sys-color-border',
  '--sys-color-text-muted',
] as const;

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly http = inject(HttpClient);

  obter(): Observable<Tema> {
    return this.http.get<Tema>(`${API_URL}/tema`);
  }

  atualizar(tema: Tema): Observable<Tema> {
    return this.http.put<Tema>(`${API_URL}/tema`, tema);
  }

  /** Carrega o tema no boot e aplica; falha silenciosamente para o padrão. */
  carregarEAplicar(): Observable<Tema> {
    return this.obter().pipe(
      tap((tema) => this.aplicar(tema)),
      catchError(() => {
        this.aplicar(TEMA_PADRAO);
        return of(TEMA_PADRAO);
      }),
    );
  }

  /**
   * Aplica o tema nas variáveis CSS do :root.
   * PADRAO: remove os overrides (volta aos defaults do styles.scss).
   * PERSONALIZADO: seta as variáveis com as cores escolhidas.
   */
  aplicar(tema: Tema): void {
    const root = document.documentElement;

    if (tema.modo === 'PADRAO') {
      for (const v of VARS_TEMA) root.style.removeProperty(v);
      return;
    }

    root.style.setProperty('--sys-color-primary', tema.primary);
    root.style.setProperty('--sys-color-primary-strong', tema.primaryStrong);
    root.style.setProperty('--sys-color-on-primary', tema.onPrimary);
    root.style.setProperty('--sys-color-bg', tema.bg);
    root.style.setProperty('--sys-color-text', tema.text);
    // Derivadas translúcidas a partir da cor de texto (mantêm o efeito glass).
    root.style.setProperty(
      '--sys-color-surface',
      this.comAlpha(tema.text, 0.06),
    );
    root.style.setProperty(
      '--sys-color-border',
      this.comAlpha(tema.text, 0.18),
    );
    root.style.setProperty(
      '--sys-color-text-muted',
      this.comAlpha(tema.text, 0.6),
    );
  }

  /** Converte #RRGGBB + alpha em rgba(). */
  private comAlpha(hex: string, alpha: number): string {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return hex;
    const int = parseInt(m[1], 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
