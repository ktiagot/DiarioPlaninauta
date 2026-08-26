import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';
import { SessionService } from '../auth/session.service';
import { CheckInStatus, SorteioSnapshot } from './sorteio.models';

@Injectable({ providedIn: 'root' })
export class SorteioService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  getSnapshot(): Observable<SorteioSnapshot> {
    return this.http.get<SorteioSnapshot>(`${API_URL}/precompeonato/atual/sorteio`, {
      headers: this.headers(),
    });
  }

  sortearMesas(): Observable<SorteioSnapshot> {
    return this.http.post<SorteioSnapshot>(
      `${API_URL}/precompeonato/atual/sortear-mesas`,
      {},
      { headers: this.headers() },
    );
  }

  reSortearMesas(): Observable<SorteioSnapshot> {
    return this.http.post<SorteioSnapshot>(
      `${API_URL}/precompeonato/atual/re-sortear-mesas`,
      {},
      { headers: this.headers() },
    );
  }

  getCheckInStatus(): Observable<CheckInStatus> {
    return this.http.get<CheckInStatus>(`${API_URL}/precompeonato/atual/checkin`, {
      headers: this.headers(),
    });
  }

  checkIn(): Observable<CheckInStatus> {
    return this.http.post<CheckInStatus>(
      `${API_URL}/precompeonato/atual/checkin`,
      {},
      { headers: this.headers() },
    );
  }

  cancelCheckIn(): Observable<CheckInStatus> {
    return this.http.delete<CheckInStatus>(`${API_URL}/precompeonato/atual/checkin`, {
      headers: this.headers(),
    });
  }

  private headers(): HttpHeaders {
    const auth = this.session.authHeaders();
    return new HttpHeaders(auth);
  }
}
