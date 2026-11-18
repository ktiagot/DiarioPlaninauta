import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import {
  MesaoInscricaoAdmin,
  MesaoSessao,
  MesaoSessaoPayload,
  MesaoTipo,
} from './mesao-live.models';

@Injectable({ providedIn: 'root' })
export class MesaoLiveService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/mesao-live`;

  listar(): Observable<MesaoSessao[]> {
    return this.http.get<MesaoSessao[]>(`${this.base}/sessoes`);
  }

  inscrever(sessaoId: string, tipo: MesaoTipo): Observable<MesaoSessao> {
    return this.http.post<MesaoSessao>(`${this.base}/sessoes/${sessaoId}/inscricao`, { tipo });
  }

  cancelar(sessaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessoes/${sessaoId}/inscricao`);
  }

  // --- admin ---
  listarAdmin(): Observable<MesaoSessao[]> {
    return this.http.get<MesaoSessao[]>(`${this.base}/admin/sessoes`);
  }

  criar(payload: MesaoSessaoPayload): Observable<MesaoSessao> {
    return this.http.post<MesaoSessao>(`${this.base}/admin/sessoes`, payload);
  }

  atualizar(id: string, payload: Partial<MesaoSessaoPayload>): Observable<MesaoSessao> {
    return this.http.patch<MesaoSessao>(`${this.base}/admin/sessoes/${id}`, payload);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/sessoes/${id}`);
  }

  listarInscricoes(sessaoId: string): Observable<MesaoInscricaoAdmin[]> {
    return this.http.get<MesaoInscricaoAdmin[]>(`${this.base}/admin/sessoes/${sessaoId}/inscricoes`);
  }

  removerInscricao(inscricaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/inscricoes/${inscricaoId}`);
  }
}
