import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import { MinhasMesasResponse } from './minhas-mesas.models';

@Injectable({ providedIn: 'root' })
export class MinhasMesasService {
  private readonly http = inject(HttpClient);

  getMinhasMesas(): Observable<MinhasMesasResponse> {
    return this.http.get<MinhasMesasResponse>(`${API_URL}/precompeonato/atual/minhas-mesas`);
  }
}
