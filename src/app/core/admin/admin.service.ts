import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config/api.config';
import { mapRodadaAtual } from '../rodadas/rodadas.mapper';
import { Rodada, RodadaAtualApi } from '../rodadas/rodadas.models';
import {
  CreateRodadaPayload,
  RodadasListResponse,
  SorteioSnapshot,
} from '../sorteio/sorteio.models';
import {
  AjustePontos,
  AjustePontosPayload,
  CampeonatoAdmin,
  CreateCampeonatoPayload,
  CreateGrupoPayload,
  GrupoAdmin,
  InscritoResumo,
  JogadorAdmin,
  RodadaAtual,
  SubmitResultadoPayload,
  UpdateGrupoPayload,
  UpdateInscricaoPayload,
  UpdateRodadaPayload,
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

  /** Detalhe completo (mesas + resultados) de qualquer rodada do campeonato atual. */
  getRodadaDetalhe(rodadaId: string): Observable<Rodada> {
    return this.http
      .get<RodadaAtualApi>(`${API_URL}/precompeonato/rodadas/${rodadaId}`)
      .pipe(map((r) => mapRodadaAtual(r)));
  }

  // ---- Gestão manual ----

  private rodadaUrl(path: string): string {
    return `${API_URL}/precompeonato/${path}`;
  }

  private mapRodada = map((r: RodadaAtualApi) => mapRodadaAtual(r));

  recalcularRanking(): Observable<void> {
    return this.http.post<void>(this.rodadaUrl('atual/ranking/recalcular'), {});
  }

  atualizarRodada(id: string, payload: UpdateRodadaPayload): Observable<Rodada> {
    return this.http.patch<RodadaAtualApi>(this.rodadaUrl(`rodadas/${id}`), payload).pipe(this.mapRodada);
  }

  reabrirRodada(id: string): Observable<Rodada> {
    return this.http.post<RodadaAtualApi>(this.rodadaUrl(`rodadas/${id}/reabrir`), {}).pipe(this.mapRodada);
  }

  excluirRodada(id: string): Observable<void> {
    return this.http.delete<void>(this.rodadaUrl(`rodadas/${id}`));
  }

  criarMesa(rodadaId: string): Observable<Rodada> {
    return this.http.post<RodadaAtualApi>(this.rodadaUrl(`rodadas/${rodadaId}/mesas`), {}).pipe(this.mapRodada);
  }

  excluirMesa(mesaId: string): Observable<Rodada> {
    return this.http.delete<RodadaAtualApi>(this.rodadaUrl(`mesas/${mesaId}`)).pipe(this.mapRodada);
  }

  colocarJogador(mesaId: string, inscricaoId: string): Observable<Rodada> {
    return this.http
      .post<RodadaAtualApi>(this.rodadaUrl(`mesas/${mesaId}/jogadores`), { inscricaoId })
      .pipe(this.mapRodada);
  }

  removerJogadorMesa(mesaId: string, inscricaoId: string): Observable<Rodada> {
    return this.http
      .delete<RodadaAtualApi>(this.rodadaUrl(`mesas/${mesaId}/jogadores/${inscricaoId}`))
      .pipe(this.mapRodada);
  }

  invalidarMesa(mesaId: string): Observable<Rodada> {
    return this.http.post<RodadaAtualApi>(this.rodadaUrl(`mesas/${mesaId}/invalidar`), {}).pipe(this.mapRodada);
  }

  limparResultadoMesa(mesaId: string): Observable<Rodada> {
    return this.http
      .post<RodadaAtualApi>(this.rodadaUrl(`mesas/${mesaId}/limpar-resultado`), {})
      .pipe(this.mapRodada);
  }

  ajustarPontos(inscricaoId: string, payload: AjustePontosPayload): Observable<AjustePontos> {
    return this.http.post<AjustePontos>(this.rodadaUrl(`inscricoes/${inscricaoId}/ajustes`), payload);
  }

  listarAjustes(inscricaoId: string): Observable<AjustePontos[]> {
    return this.http.get<AjustePontos[]>(this.rodadaUrl(`inscricoes/${inscricaoId}/ajustes`));
  }

  atualizarInscricao(id: string, payload: UpdateInscricaoPayload): Observable<void> {
    return this.http.patch<void>(this.rodadaUrl(`inscricoes/${id}`), payload);
  }

  removerInscricao(id: string): Observable<void> {
    return this.http.delete<void>(this.rodadaUrl(`inscricoes/${id}`));
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

  listGrupos(campeonatoId: string): Observable<GrupoAdmin[]> {
    return this.http.get<GrupoAdmin[]>(
      `${API_URL}/precompeonato/campeonatos/${campeonatoId}/grupos`,
    );
  }

  createGrupo(campeonatoId: string, payload: CreateGrupoPayload): Observable<GrupoAdmin> {
    return this.http.post<GrupoAdmin>(
      `${API_URL}/precompeonato/campeonatos/${campeonatoId}/grupos`,
      payload,
    );
  }

  updateGrupo(id: string, payload: UpdateGrupoPayload): Observable<GrupoAdmin> {
    return this.http.patch<GrupoAdmin>(`${API_URL}/precompeonato/grupos/${id}`, payload);
  }

  deleteGrupo(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/precompeonato/grupos/${id}`);
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

  /** Sincroniza (total) os membros do YouTube a partir da lista de e-mails do CSV. */
  sincronizarMembrosYoutube(
    emails: string[],
  ): Observable<SincronizarMembrosYoutubeResponse> {
    return this.http.post<SincronizarMembrosYoutubeResponse>(
      `${API_URL}/comunidade/admin/youtube/sincronizar`,
      { emails },
    );
  }
}

export interface SincronizarMembrosYoutubeResponse {
  recebidos: number;
  marcadosMembro: number;
  removidosMembro: number;
  semCadastro: number;
}
