import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { Mesa, CreateMesaPayload } from './mesas.models';

@Injectable({ providedIn: 'root' })
export class MesasService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${API_URL}/mesas`);
  }

  minhas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${API_URL}/mesas/minhas`);
  }

  criar(payload: CreateMesaPayload): Observable<Mesa> {
    return this.http.post<Mesa>(`${API_URL}/mesas`, payload);
  }

  atualizarLink(mesaId: string, linkPartida: string): Observable<Mesa> {
    return this.http.put<Mesa>(`${API_URL}/mesas/${mesaId}/link`, { linkPartida });
  }

  editar(
    mesaId: string,
    dados: { dataHora: string; linkPartida?: string; descricao?: string },
  ): Observable<Mesa> {
    return this.http.put<Mesa>(`${API_URL}/mesas/${mesaId}`, dados);
  }

  fechar(mesaId: string): Observable<Mesa> {
    return this.http.patch<Mesa>(`${API_URL}/mesas/${mesaId}/fechar`, {});
  }

  entrar(mesaId: string): Observable<Mesa> {
    return this.http.post<Mesa>(`${API_URL}/mesas/${mesaId}/entrar`, {});
  }

  sair(mesaId: string): Observable<Mesa> {
    return this.http.delete<Mesa>(`${API_URL}/mesas/${mesaId}/sair`);
  }

  removerJogador(mesaId: string, userId: string): Observable<Mesa> {
    return this.http.delete<Mesa>(`${API_URL}/mesas/${mesaId}/jogadores/${userId}`);
  }

  apagar(mesaId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/mesas/${mesaId}`);
  }

  convidar(mesaId: string, userId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_URL}/mesas/${mesaId}/convidar/${userId}`,
      {},
    );
  }

  aceitarConvite(conviteId: string): Observable<Mesa> {
    return this.http.post<Mesa>(`${API_URL}/mesas/convites/${conviteId}/aceitar`, {});
  }

  rejeitarConvite(conviteId: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/mesas/convites/${conviteId}/rejeitar`, {});
  }
}
