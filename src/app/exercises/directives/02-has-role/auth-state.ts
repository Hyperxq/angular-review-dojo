import { Injectable, signal } from '@angular/core';

export type Role = 'admin' | 'editor' | 'guest';

@Injectable({ providedIn: 'root' })
export class AuthState {
  readonly role = signal<Role>('guest');
}
