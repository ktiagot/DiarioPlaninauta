import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import { JogadorComunidade, ContatoResponse } from './comunidade.models';

@Injectable({ providedIn: 'root' })
export class ComunidadeService {
  private readonly http = inject(HttpClient);

  listarJogadores(filtros?: {
    busca?: string;
    cidade?: string;
    formato?: string;
    disponibilidade?: string;
  }): Observable<JogadorComunidade[]> {
    const params: Record<string, string> = {};
    if (filtros?.busca) params['busca'] = filtros.busca;
    if (filtros?.cidade) params['cidade'] = filtros.cidade;
    if (filtros?.formato) params['formato'] = filtros.formato;
    if (filtros?.disponibilidade) params['disponibilidade'] = filtros.disponibilidade;

    return this.http.get<JogadorComunidade[]>(`${API_URL}/comunidade/jogadores`, { params });
  }

  obterContato(userId: string): Observable<ContatoResponse> {
    return this.http.get<ContatoResponse>(`${API_URL}/comunidade/jogadores/${userId}/contato`);
  }

  listarFavoritos(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/comunidade/favoritos`);
  }

  favoritar(userId: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/comunidade/favoritos/${userId}`, {});
  }

  desfavoritar(userId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/comunidade/favoritos/${userId}`);
  }
}
