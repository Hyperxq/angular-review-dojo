import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Session {
  readonly userId = signal<string | null>(null);

  login(userId: string) {
    this.userId.set(userId);
  }

  logout() {
    this.userId.set(null);
  }
}
