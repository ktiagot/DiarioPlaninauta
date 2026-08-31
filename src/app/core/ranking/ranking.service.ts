import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL } from '../config/api.config';
import { JogadorInscrito } from '../inscricoes/inscricoes.models';

interface CampeonatoPublicoApi {
  id: string;
  nome: string;
  edicao: string;
}

interface JogadorRankingApi {
  id: string;
  nomeJogador: string;
  nick: string;
  comandante: string;
  deckNome: string;
  deckUrl: string | null;
  posicao: number | null;
  pontos: number;
}

export interface CampeonatoOpcao {
  id: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);

  listarCampeonatos(): Observable<CampeonatoOpcao[]> {
    return this.http
      .get<CampeonatoPublicoApi[]>(`${API_URL}/precompeonato/ranking/campeonatos`)
      .pipe(
        map((lista) =>
          lista.map((c) => ({ id: c.id, label: `${c.nome} ${c.edicao}`.trim() })),
        ),
      );
  }

  /** Ranking geral (agregado) quando campeonatoId ausente; específico caso contrário. */
  buscarRanking(campeonatoId?: string): Observable<JogadorInscrito[]> {
    if (!campeonatoId) {
      return this.http
        .get<JogadorRankingApi[]>(`${API_URL}/precompeonato/ranking-geral`)
        .pipe(map((lista) => this.mapear(lista)));
    }
    const params = new HttpParams().set('campeonatoId', campeonatoId);
    return this.http
      .get<JogadorRankingApi[]>(`${API_URL}/precompeonato/atual/jogadores`, { params })
      .pipe(map((lista) => this.mapear(lista)));
  }

  private mapear(lista: JogadorRankingApi[]): JogadorInscrito[] {
    return lista.map((j, idx) => ({
      id: idx,
      ranking: j.posicao ?? idx + 1,
      nome: j.nomeJogador,
      nickname: j.nick,
      comandante: j.comandante ?? '',
      deckNome: j.deckNome ?? '',
      deckUrl: j.deckUrl ?? undefined,
      meta: 0,
      pontos: j.pontos ?? 0,
      eliminacoes: 0,
    }));
  }
}
