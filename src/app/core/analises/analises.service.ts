import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import {
  AnaliseInscricaoAdmin,
  AnaliseSessao,
  AnaliseSessaoPayload,
  InscreverAnalisePayload,
} from './analises.models';

@Injectable({ providedIn: 'root' })
export class AnalisesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/analises`;

  listar(): Observable<AnaliseSessao[]> {
    return this.http.get<AnaliseSessao[]>(`${this.base}/sessoes`);
  }

  inscrever(sessaoId: string, payload: InscreverAnalisePayload): Observable<AnaliseSessao> {
    return this.http.post<AnaliseSessao>(`${this.base}/sessoes/${sessaoId}/inscricao`, payload);
  }

  atualizarMinha(
    sessaoId: string,
    payload: Partial<InscreverAnalisePayload>,
  ): Observable<AnaliseSessao> {
    return this.http.patch<AnaliseSessao>(`${this.base}/sessoes/${sessaoId}/inscricao`, payload);
  }

  cancelar(sessaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessoes/${sessaoId}/inscricao`);
  }

  // --- admin ---
  listarAdmin(): Observable<AnaliseSessao[]> {
    return this.http.get<AnaliseSessao[]>(`${this.base}/admin/sessoes`);
  }

  criar(payload: AnaliseSessaoPayload): Observable<AnaliseSessao> {
    return this.http.post<AnaliseSessao>(`${this.base}/admin/sessoes`, payload);
  }

  atualizar(id: string, payload: Partial<AnaliseSessaoPayload>): Observable<AnaliseSessao> {
    return this.http.patch<AnaliseSessao>(`${this.base}/admin/sessoes/${id}`, payload);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/sessoes/${id}`);
  }

  listarInscricoes(sessaoId: string): Observable<AnaliseInscricaoAdmin[]> {
    return this.http.get<AnaliseInscricaoAdmin[]>(`${this.base}/admin/sessoes/${sessaoId}/inscricoes`);
  }

  removerInscricao(inscricaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/inscricoes/${inscricaoId}`);
  }
}
