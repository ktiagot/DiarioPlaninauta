import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';
import { Produto, PontoTransacao, Saldo } from './loja.models';

@Injectable({ providedIn: 'root' })
export class LojaService {
  private readonly http = inject(HttpClient);

  listarProdutos(): Observable<Produto[]> {
    return this.http
      .get<Produto[]>(`${API_URL}/loja/produtos`)
      .pipe(catchError(() => throwError(() => new Error('Não foi possível carregar os produtos.'))));
  }

  obterSaldo(): Observable<Saldo> {
    return this.http
      .get<Saldo>(`${API_URL}/loja/pontos`)
      .pipe(catchError(() => throwError(() => new Error('Não foi possível carregar o saldo.'))));
  }

  obterHistorico(): Observable<PontoTransacao[]> {
    return this.http
      .get<PontoTransacao[]>(`${API_URL}/loja/pontos/historico`)
      .pipe(catchError(() => throwError(() => new Error('Não foi possível carregar o histórico.'))));
  }

  resgatar(produtoId: string): Observable<PontoTransacao> {
    return this.http
      .post<PontoTransacao>(`${API_URL}/loja/resgatar`, { produtoId })
      .pipe(catchError(() => throwError(() => new Error('Não foi possível realizar o resgate.'))));
  }
}
