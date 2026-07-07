import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { API_URL } from '../config/api.config';
import { CreateUserRequest, User } from './users.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  create(data: CreateUserRequest) {
    return this.http.post<User>(`${API_URL}/users`, data);
  }

  findById(id: string) {
    return this.http.get<User>(`${API_URL}/users/${id}`);
  }
}
