import { Service, computed, effect, inject, signal } from '@angular/core';
import { NewAlert, PriceAlert } from './alert.models';
import { AlertsApi } from './alerts-api';

@Service()
export class AlertsStore {
  private readonly api = inject(AlertsApi);
  private readonly _alerts = signal<PriceAlert[]>([]);

  readonly alerts = this._alerts.asReadonly();
  readonly count = computed(() => this._alerts().length);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => localStorage.setItem('alerts:count', String(this.count())));
  }

  load() {
    this.api.list().subscribe((alerts) => this._alerts.set(alerts));
  }

  add(alert: NewAlert) {
    this.error.set(null);
    this.api.create(alert).subscribe({
      next: (created) => this._alerts.update((alerts) => [...alerts, created]),
      error: () => this.error.set('Could not create the alert.'),
    });
  }

  remove(id: number) {
    this._alerts.update((alerts) => alerts.filter((a) => a.id !== id));
    this.api.remove(id).subscribe();
  }
}
