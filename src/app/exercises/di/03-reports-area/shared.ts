import { HttpInterceptorFn } from '@angular/common/http';
import { Service, computed, signal } from '@angular/core';

export const traceInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Trace-Id': 't-1' } }));

@Service()
export class AuditLog {
  readonly entries = signal<string[]>([]);

  log(entry: string) {
    this.entries.update((entries) => [...entries, entry]);
  }
}

@Service()
export class Selection {
  readonly ids = signal<number[]>([]);
  readonly count = computed(() => this.ids().length);

  toggle(id: number) {
    this.ids.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }
}
