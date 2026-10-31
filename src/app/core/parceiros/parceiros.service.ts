import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import { CreateParceiroPayload, Parceiro } from './parceiros.models';

@Injectable({ providedIn: 'root' })
export class ParceirosService {
  private readonly http = inject(HttpClient);

  /** Lista pública (apenas parceiros ativos). */
  listarPublico(): Observable<Parceiro[]> {
    return this.http.get<Parceiro[]>(`${API_URL}/parceiros`);
  }

  /** Registra um clique (fire-and-forget). */
  registrarClique(id: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/parceiros/${id}/clique`, {});
  }

  // --- admin ---
  listarAdmin(): Observable<Parceiro[]> {
    return this.http.get<Parceiro[]>(`${API_URL}/parceiros/admin`);
  }

  criar(payload: CreateParceiroPayload): Observable<Parceiro> {
    return this.http.post<Parceiro>(`${API_URL}/parceiros`, payload);
  }

  atualizar(id: string, payload: Partial<CreateParceiroPayload>): Observable<Parceiro> {
    return this.http.patch<Parceiro>(`${API_URL}/parceiros/${id}`, payload);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/parceiros/${id}`);
  }
}
