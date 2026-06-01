import { Injectable } from '@angular/core';

const TOKEN_KEY = 'beedu.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private memoryToken: string | null = null;

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? this.memoryToken;
    } catch {
      return this.memoryToken;
    }
  }

  setToken(token: string): void {
    this.memoryToken = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  }

  clearToken(): void {
    this.memoryToken = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}
