import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';
import { mapRodada } from './rodadas.mapper';
import {
  ConfirmarPosicoesPayload,
  Rodada,
  RodadaApi,
  SalvarLinkPayload,
} from './rodadas.models';
import { RODADA_MOCK } from './rodadas.mock';

export type ConfirmarPosicoesResult = 'saved' | 'local';

@Injectable({ providedIn: 'root' })
export class RodadasService {
  constructor(private http: HttpClient) {}

  getRodadaAtual(): Observable<Rodada | null> {
    return this.http.get<RodadaApi[]>(`${API_URL}/rodadas`).pipe(
      map((rodadas) => (rodadas.length ? mapRodada(rodadas[0]) : null)),
      catchError(() => {
        if (this.useMockFallback()) {
          return of(RODADA_MOCK);
        }
        return throwError(() => new Error('Não foi possível carregar as mesas da rodada.'));
      }),
    );
  }

  salvarLinkMesa(mesaId: number, payload: SalvarLinkPayload): Observable<ConfirmarPosicoesResult> {
    return this.http
      .put<void>(`${API_URL}/mesas/${mesaId}/link`, payload, { headers: this.authHeaders() })
      .pipe(
        map(() => 'saved' as const),
        catchError(() => of('local' as const)),
      );
  }

  confirmarPosicoes(
    mesaId: number,
    payload: ConfirmarPosicoesPayload,
  ): Observable<ConfirmarPosicoesResult> {
    return this.http
      .post<void>(`${API_URL}/mesas/${mesaId}/posicoes`, payload, { headers: this.authHeaders() })
      .pipe(
        map(() => 'saved' as const),
        catchError(() => of('local' as const)),
      );
  }

  normalizeLink(link: string): string {
    const trimmed = link.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  private useMockFallback(): boolean {
    return window.location.hostname === 'localhost';
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
