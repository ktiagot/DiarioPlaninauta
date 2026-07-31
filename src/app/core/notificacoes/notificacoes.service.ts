import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';
import { ContadorNaoLidas, Notificacao } from './notificacoes.models';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Notificacao[]> {
    return this.http
      .get<Notificacao[]>(`${API_URL}/notificacoes`)
      .pipe(catchError(() => throwError(() => new Error('Não foi possível carregar as notificações.'))));
  }

  contarNaoLidas(): Observable<ContadorNaoLidas> {
    return this.http
      .get<ContadorNaoLidas>(`${API_URL}/notificacoes/nao-lidas`)
      .pipe(catchError(() => throwError(() => new Error('Não foi possível carregar contagem.'))));
  }

  marcarComoLida(id: string): Observable<Notificacao> {
    return this.http
      .patch<Notificacao>(`${API_URL}/notificacoes/${id}/ler`, {})
      .pipe(catchError(() => throwError(() => new Error('Não foi possível marcar como lida.'))));
  }

  marcarTodasComoLidas(): Observable<{ count: number }> {
    return this.http
      .patch<{ count: number }>(`${API_URL}/notificacoes/ler-todas`, {})
      .pipe(catchError(() => throwError(() => new Error('Não foi possível marcar todas como lidas.'))));
  }
}
