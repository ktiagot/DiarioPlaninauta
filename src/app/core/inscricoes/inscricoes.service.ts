import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';
import { mapRodada } from '../rodadas/rodadas.mapper';
import { RodadaApi } from '../rodadas/rodadas.models';
import { aplicarMeta, mapInscricao, ordenarPorRanking } from './inscricoes.mapper';
import { INSCRICOES_MOCK } from './inscricoes.mock';
import {
  CreateInscricaoPayload,
  CreateInscricaoResponse,
  InscricaoApi,
  JogadorInscrito,
} from './inscricoes.models';

@Injectable({ providedIn: 'root' })
export class InscricoesService {
  constructor(private http: HttpClient) {}

  getJogadoresInscritos(): Observable<JogadorInscrito[]> {
    return forkJoin({
      inscricoes: this.http.get<InscricaoApi[]>(`${API_URL}/precompeonato/atual/jogadores`).pipe(
        catchError(() => of(null)),
      ),
      rodadas: this.http.get<RodadaApi[]>(`${API_URL}/precompeonato/atual/rodada`).pipe(
        catchError(() => of([] as RodadaApi[])),
      ),
    }).pipe(
      map(({ inscricoes, rodadas }) => {
        if (!inscricoes) {
          if (this.useMockFallback()) {
            return INSCRICOES_MOCK;
          }
          throw new Error('Não foi possível carregar os jogadores inscritos.');
        }

        const rodadaMap = this.buildRodadaMesaMap(rodadas);
        const eliminacoesMap = this.buildEliminacoesMap(rodadas);
        const jogadores = inscricoes
          .filter((i) => i.ativo !== false)
          .map((i) => {
            const base = mapInscricao(i);
            const mesaInfo = rodadaMap.get(String(i.id));

            return {
              id: base.id,
              ranking: base.rankingBase,
              nome: base.nome,
              nickname: base.nickname,
              comandante: base.comandante,
              deckNome: base.deckNome,
              deckUrl: base.deckUrl,
              meta: 0,
              pontos: base.pontos,
              eliminacoes: eliminacoesMap.get(String(i.id)) ?? 0,
              rodada: mesaInfo?.rodada,
              mesa: mesaInfo?.mesa,
            } satisfies JogadorInscrito;
          });

        const comMeta = aplicarMeta(jogadores);
        return ordenarPorRanking(comMeta);
      }),
      catchError(() => {
        if (this.useMockFallback()) {
          return of(INSCRICOES_MOCK);
        }
        return throwError(() => new Error('Não foi possível carregar os jogadores inscritos.'));
      }),
    );
  }

  createInscricao(payload: CreateInscricaoPayload): Observable<CreateInscricaoResponse> {
    return this.http.post<CreateInscricaoResponse>(
      `${API_URL}/precompeonato/inscricoes`,
      payload,
    );
  }

  private buildRodadaMesaMap(
    rodadas: RodadaApi[],
  ): Map<string, { rodada: number; mesa: number }> {
    const map = new Map<string, { rodada: number; mesa: number }>();

    for (const rodadaApi of rodadas) {
      const rodada = mapRodada(rodadaApi);
      for (const mesa of rodada.mesas) {
        for (const jogador of mesa.jogadores) {
          map.set(String(jogador.inscricaoId), {
            rodada: rodada.numero,
            mesa: mesa.numeroMesa,
          });
        }
      }
    }

    return map;
  }

  private buildEliminacoesMap(rodadas: RodadaApi[]): Map<string, number> {
    const map = new Map<string, number>();

    for (const rodadaApi of rodadas) {
      const rodada = mapRodada(rodadaApi);
      for (const mesa of rodada.mesas) {
        for (const jogador of mesa.jogadores) {
          const kills = jogador.kills ?? 0;
          if (!kills) continue;
          const key = String(jogador.inscricaoId);
          map.set(key, (map.get(key) ?? 0) + kills);
        }
      }
    }

    return map;
  }

  private useMockFallback(): boolean {
    return window.location.hostname === 'localhost';
  }
}
