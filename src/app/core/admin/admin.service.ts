import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { SorteioSnapshot, RodadaAtual, CheckInStatus } from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  /** Retorna snapshot admin: classificação + check-in + mesas sorteadas */
  getSorteio(): Observable<SorteioSnapshot> {
    return this.http.get<SorteioSnapshot>(`${API_URL}/precompeonato/atual/sorteio`);
  }

  /** Sortear mesas (formato suíço) para a rodada de check-in */
  sortearMesas(): Observable<SorteioSnapshot> {
    return this.http.post<SorteioSnapshot>(`${API_URL}/precompeonato/atual/sortear-mesas`, {});
  }

  /** Finalizar rodada (admin) */
  finalizarRodada(rodadaId: string): Observable<RodadaAtual> {
    return this.http.post<RodadaAtual>(`${API_URL}/precompeonato/rodadas/${rodadaId}/finalizar`, {});
  }

  /** Submeter resultado de uma mesa */
  submitResultado(mesaId: string, payload: SubmitResultadoPayload): Observable<RodadaAtual> {
    return this.http.post<RodadaAtual>(`${API_URL}/precompeonato/mesas/${mesaId}/resultado`, payload);
  }

  /** Listar inscritos do campeonato atual */
  getInscritos(): Observable<InscritoResumo[]> {
    return this.http.get<InscritoResumo[]>(`${API_URL}/precompeonato/atual/jogadores`);
  }

  /** Rodada atual */
  getRodadaAtual(): Observable<RodadaAtual | null> {
    return this.http.get<RodadaAtual | null>(`${API_URL}/precompeonato/atual/rodada`);
  }
}

export interface SubmitResultadoPayload {
  jogadores: { inscricaoId: string; posicaoFinal: number; kills: number }[];
  empate: boolean;
  linkPartida?: string;
}

export interface InscritoResumo {
  id: string;
  nome: string;
  nick: string;
  email: string;
  deckNome: string;
  comandante: string;
  pontos: number;
  posicao: number | null;
  ativo: boolean;
}
