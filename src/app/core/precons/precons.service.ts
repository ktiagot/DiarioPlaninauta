import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import {
  CreatePreconPayload,
  PreconAdmin,
  PreconComandante,
  PreconListItem,
  PreconSyncResult,
  UpdatePreconPayload,
} from './precons.models';

@Injectable({ providedIn: 'root' })
export class PreconsService {
  private readonly http = inject(HttpClient);

  search(busca?: string): Observable<PreconListItem[]> {
    const params = busca?.trim() ? { busca: busca.trim() } : undefined;
    return this.http.get<PreconListItem[]>(`${API_URL}/precons`, { params });
  }

  listComandantes(preconId: string): Observable<PreconComandante[]> {
    return this.http.get<PreconComandante[]>(`${API_URL}/precons/${preconId}/comandantes`);
  }

  listAdmin(): Observable<PreconAdmin[]> {
    return this.http.get<PreconAdmin[]>(`${API_URL}/precons/admin`);
  }

  create(payload: CreatePreconPayload): Observable<PreconAdmin> {
    return this.http.post<PreconAdmin>(`${API_URL}/precons`, payload);
  }

  update(id: string, payload: UpdatePreconPayload): Observable<PreconAdmin> {
    return this.http.patch<PreconAdmin>(`${API_URL}/precons/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/precons/${id}`);
  }

  sync(): Observable<PreconSyncResult> {
    return this.http.post<PreconSyncResult>(`${API_URL}/precons/sync`, {});
  }
}
