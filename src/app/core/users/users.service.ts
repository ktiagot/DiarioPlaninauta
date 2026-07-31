import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { API_URL } from '../config/api.config';
import { AvailabilityResponse, CreateUserRequest, User } from './users.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  create(data: CreateUserRequest) {
    return this.http.post<User>(`${API_URL}/users`, data);
  }

  findById(id: string) {
    return this.http.get<User>(`${API_URL}/users/${id}`);
  }

  update(id: string, data: Partial<CreateUserRequest>) {
    return this.http.patch<User>(`${API_URL}/users/${id}`, data);
  }

  checkAvailability(params: { email?: string; nick?: string }) {
    let httpParams = new HttpParams();
    if (params.email) {
      httpParams = httpParams.set('email', params.email);
    }
    if (params.nick) {
      httpParams = httpParams.set('nick', params.nick);
    }
    return this.http.get<AvailabilityResponse>(`${API_URL}/users/availability`, {
      params: httpParams,
    });
  }
}
