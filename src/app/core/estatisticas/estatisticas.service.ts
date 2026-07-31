import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';
import { EstatisticasResponse } from './estatisticas.models';

@Injectable({ providedIn: 'root' })
export class EstatisticasService {
  private readonly http = inject(HttpClient);

  getEstatisticas(userId?: string): Observable<EstatisticasResponse> {
    const params = userId ? { userId } : {};
    return this.http
      .get<EstatisticasResponse>(`${API_URL}/precompeonato/estatisticas`, { params })
      .pipe(
        catchError(() =>
          throwError(() => new Error('Não foi possível carregar as estatísticas.')),
        ),
      );
  }
}
