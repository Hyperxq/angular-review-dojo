import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  readonly token = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  set(token: string | null) {
    this.token.set(token);
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
