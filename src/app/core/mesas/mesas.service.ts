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
}
