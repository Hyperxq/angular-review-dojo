import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from './auth';

@Component({
  selector: 'app-session-demo',
  template: `
    <button type="button" class="load" (click)="load()">Load dashboard</button>
    <button type="button" class="logout" (click)="auth.logout()">Sign out</button>
    <p class="status">{{ status() }}</p>
  `,
})
export class SessionDemo {
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthService);
  protected readonly status = signal('');

  protected load() {
    forkJoin([
      this.http.get('/api/products'),
      this.http.get('/api/stock'),
      this.http.get('/api/categories/keyboards'),
    ]).subscribe({
      next: () => this.status.set('Dashboard loaded'),
      error: (error: Error) => this.status.set(error.message),
    });
  }
}
