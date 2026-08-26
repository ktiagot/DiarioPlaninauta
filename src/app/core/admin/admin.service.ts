import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import {
  CreateRodadaPayload,
  RodadasListResponse,
  SorteioSnapshot,
} from '../sorteio/sorteio.models';
import {
  CampeonatoAdmin,
  CreateCampeonatoPayload,
  InscritoResumo,
  JogadorAdmin,
  RodadaAtual,
  SubmitResultadoPayload,
  VerificarApoiaResponse,
} from './admin.models';

export interface DashboardMetricas {
  gerais: {
    totalUsuarios: number;
    apoiadoresAtivos: number;
    exApoiadores: number;
    campeonatosRealizados: number;
    totalRodadas: number;
    totalPartidas: number;
    totalMesasCasuais: number;
  };
  evolucaoRodadas: { label: string; jogadores: number; mesas: number }[];
  metagameDistribuicao: { comandante: string; quantidade: number }[];
  topKillsPorRodada: { label: string; kills: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getDashboardMetricas(): Observable<DashboardMetricas> {
    return this.http.get<DashboardMetricas>(`${API_URL}/precompeonato/dashboard`);
  }

  getSorteio(): Observable<SorteioSnapshot> {
    return this.http.get<SorteioSnapshot>(`${API_URL}/precompeonato/atual/sorteio`);
  }

  listRodadas(): Observable<RodadasListResponse> {
    return this.http.get<RodadasListResponse>(`${API_URL}/precompeonato/atual/rodadas`);
  }

  abrirRodada(payload: CreateRodadaPayload): Observable<SorteioSnapshot> {
    return this.http.post<SorteioSnapshot>(`${API_URL}/precompeonato/atual/rodadas`, payload);
  }

  adminCheckIn(inscricaoId: string, checkIn: boolean): Observable<SorteioSnapshot> {
    return this.http.patch<SorteioSnapshot>(`${API_URL}/precompeonato/atual/checkin/admin`, {
      inscricaoId,
      checkIn,
    });
  }

  sortearMesas(): Observable<SorteioSnapshot> {
    return this.http.post<SorteioSnapshot>(`${API_URL}/precompeonato/atual/sortear-mesas`, {});
  }

  reSortearMesas(): Observable<SorteioSnapshot> {
    return this.http.post<SorteioSnapshot>(`${API_URL}/precompeonato/atual/re-sortear-mesas`, {});
  }

  finalizarRodada(rodadaId: string): Observable<RodadaAtual> {
    return this.http.post<RodadaAtual>(`${API_URL}/precompeonato/rodadas/${rodadaId}/finalizar`, {});
  }

  submitResultado(mesaId: string, payload: SubmitResultadoPayload): Observable<RodadaAtual> {
    return this.http.post<RodadaAtual>(`${API_URL}/precompeonato/mesas/${mesaId}/resultado`, {
      jogadores: payload.jogadores.map((j) => ({
        inscricaoId: j.inscricaoId,
        posicao: j.posicaoFinal,
        kills: j.kills,
      })),
      empate: payload.empate,
      empatadosInscricaoIds: payload.empatadosInscricaoIds,
      linkPartida: payload.linkPartida,
    });
  }

  getInscritos(): Observable<InscritoResumo[]> {
    return this.http.get<InscritoResumo[]>(`${API_URL}/precompeonato/atual/jogadores`);
  }

  getInscritosAdmin(): Observable<InscritoResumo[]> {
    return this.http.get<InscritoResumo[]>(`${API_URL}/precompeonato/atual/inscritos/admin`);
  }

  setInscricaoAtivo(id: string, ativo: boolean): Observable<InscritoResumo> {
    return this.http.patch<InscritoResumo>(`${API_URL}/precompeonato/inscricoes/${id}/ativo`, {
      ativo,
    });
  }

  getRodadaAtual(): Observable<RodadaAtual | null> {
    return this.http.get<RodadaAtual | null>(`${API_URL}/precompeonato/atual/rodada`);
  }

  listCampeonatos(): Observable<CampeonatoAdmin[]> {
    return this.http.get<CampeonatoAdmin[]>(`${API_URL}/precompeonato/campeonatos`);
  }

  createCampeonato(payload: CreateCampeonatoPayload): Observable<CampeonatoAdmin> {
    return this.http.post<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos`, payload);
  }

  updateCampeonato(
    id: string,
    payload: Partial<CreateCampeonatoPayload>,
  ): Observable<CampeonatoAdmin> {
    return this.http.patch<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos/${id}`, payload);
  }

  updateCampeonatoStatus(
    id: string,
    status: CampeonatoAdmin['statusCode'],
  ): Observable<CampeonatoAdmin> {
    return this.http.patch<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos/${id}/status`, {
      status,
    });
  }

  uploadCampeonatoBanner(id: string, file: File): Observable<CampeonatoAdmin> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos/${id}/banner`, body);
  }

  listJogadoresAdmin(): Observable<JogadorAdmin[]> {
    return this.http.get<JogadorAdmin[]>(`${API_URL}/comunidade/admin/jogadores`);
  }

  verificarApoia(email: string): Observable<VerificarApoiaResponse> {
    return this.http.post<VerificarApoiaResponse>(
      `${API_URL}/comunidade/admin/apoia/verificar/${encodeURIComponent(email)}`,
      {},
    );
  }
}
