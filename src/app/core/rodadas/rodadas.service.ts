import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable, inject } from '@angular/core';

import { Observable, map, throwError } from 'rxjs';

import { catchError } from 'rxjs/operators';



import { API_URL } from '../config/api.config';

import { SessionService } from '../auth/session.service';

import { mapRodadaAtual } from './rodadas.mapper';

import {

  ConfirmarPosicoesPayload,

  Rodada,

  RodadaAtualApi,

  SalvarLinkPayload,

} from './rodadas.models';



@Injectable({ providedIn: 'root' })

export class RodadasService {

  private readonly http = inject(HttpClient);

  private readonly session = inject(SessionService);



  getRodadaAtual(): Observable<Rodada | null> {

    return this.http.get<RodadaAtualApi | null>(`${API_URL}/precompeonato/atual/rodada`).pipe(

      map((rodada) => (rodada ? mapRodadaAtual(rodada) : null)),

      catchError(() =>

        throwError(() => new Error('Não foi possível carregar as mesas da rodada.')),

      ),

    );

  }



  salvarLinkMesa(mesaId: string, payload: SalvarLinkPayload): Observable<void> {

    return this.http

      .put<void>(`${API_URL}/mesas/${mesaId}/link`, payload, { headers: this.authHeaders() })

      .pipe(

        catchError(() =>

          throwError(() => new Error('Não foi possível salvar o link da partida.')),

        ),

      );

  }



  confirmarPosicoes(mesaId: string, payload: ConfirmarPosicoesPayload): Observable<Rodada> {

    return this.http

      .post<RodadaAtualApi>(`${API_URL}/precompeonato/mesas/${mesaId}/resultado`, payload, {

        headers: this.authHeaders(),

      })

      .pipe(

        map((rodada) => mapRodadaAtual(rodada)),

        catchError((err) => {

          const message =

            err?.error?.message ??

            err?.message ??

            'Não foi possível confirmar as posições.';

          return throwError(() => new Error(Array.isArray(message) ? message.join(' ') : message));

        }),

      );

  }



  finalizarRodada(rodadaId: string): Observable<Rodada> {

    return this.http

      .post<RodadaAtualApi>(

        `${API_URL}/precompeonato/rodadas/${rodadaId}/finalizar`,

        {},

        { headers: this.authHeaders() },

      )

      .pipe(

        map((rodada) => mapRodadaAtual(rodada)),

        catchError((err) => {

          const message =

            err?.error?.message ??

            err?.message ??

            'Não foi possível finalizar a rodada.';

          return throwError(() => new Error(Array.isArray(message) ? message.join(' ') : message));

        }),

      );

  }



  normalizeLink(link: string): string {

    const trimmed = link.trim();

    if (!trimmed) return '';

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {

      return trimmed;

    }

    return `https://${trimmed}`;

  }



  private authHeaders(): HttpHeaders {

    const auth = this.session.authHeaders();

    return new HttpHeaders(auth);

  }

}


