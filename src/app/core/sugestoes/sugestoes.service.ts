import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

export interface CreateSugestaoPayload {
  nome: string;
  telefone?: string;
  mensagem: string;
}

export interface SugestaoResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SugestoesService {
  private readonly http = inject(HttpClient);

  enviar(payload: CreateSugestaoPayload): Observable<SugestaoResponse> {
    return this.http.post<SugestaoResponse>(`${API_URL}/sugestoes`, payload);
  }
}
