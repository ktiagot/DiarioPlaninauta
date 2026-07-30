import { Injectable, signal } from '@angular/core';

const KEYS = {
  token: 'access_token',
  userId: 'user_id',
  email: 'user_email',
  role: 'user_role',
  isAdmin: 'user_is_admin',
} as const;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly revision = signal(0);

  /** Incremented on login/logout so computed signals can react. */
  readonly authRevision = this.revision.asReadonly();

  getToken(): string | null {
    return localStorage.getItem(KEYS.token);
  }

  getUserId(): string | null {
    return localStorage.getItem(KEYS.userId);
  }

  getEmail(): string | null {
    return localStorage.getItem(KEYS.email);
  }

  isAuthenticated(): boolean {
    this.revision();
    return !!this.getToken();
  }

  isAdmin(): boolean {
    this.revision();
    return localStorage.getItem(KEYS.isAdmin) === 'true';
  }

  setSession(data: {
    accessToken: string;
    id: string;
    email: string;
    role: string;
    isAdmin: boolean;
  }): void {
    localStorage.setItem(KEYS.token, data.accessToken);
    localStorage.setItem(KEYS.userId, data.id);
    localStorage.setItem(KEYS.email, data.email);
    localStorage.setItem(KEYS.role, data.role);
    localStorage.setItem(KEYS.isAdmin, data.isAdmin ? 'true' : 'false');
    this.revision.update((v) => v + 1);
  }

  clear(): void {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.userId);
    localStorage.removeItem(KEYS.email);
    localStorage.removeItem(KEYS.role);
    localStorage.removeItem(KEYS.isAdmin);
    this.revision.update((v) => v + 1);
  }

  authHeaders(): { Authorization: string } | Record<string, never> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
