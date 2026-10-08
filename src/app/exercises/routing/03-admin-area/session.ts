import { Injectable, computed, signal } from '@angular/core';

export interface SessionUser {
  name: string;
  role: 'admin' | 'customer';
}

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly current = signal<SessionUser | null>(null);
  readonly user = this.current.asReadonly();
  readonly isSignedIn = computed(() => this.current() !== null);

  signIn(user: SessionUser) {
    this.current.set(user);
  }
}
