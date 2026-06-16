import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { API_URL } from '../config/api.config';
import { BackerVerifyResponse, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  requestLogin(email: string) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/request-login`, { email });
  }

  verifyBacker(email: string) {
    return this.http.post<BackerVerifyResponse>(`${API_URL}/auth/verify-backer`, { email });
  }
}
