import { Injectable } from '@angular/core';

const TOKEN_KEY = 'beedu.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  }

  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}
