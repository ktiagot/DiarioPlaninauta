import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import { HallDaFamaEntry } from './hall-da-fama.models';

@Injectable({ providedIn: 'root' })
export class HallDaFamaService {
  private readonly http = inject(HttpClient);

  listar(): Observable<HallDaFamaEntry[]> {
    return this.http.get<HallDaFamaEntry[]>(`${API_URL}/precompeonato/hall-da-fama`);
  }
}
