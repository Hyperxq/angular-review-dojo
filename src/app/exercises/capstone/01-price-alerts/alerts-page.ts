import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { interval, mergeMap } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { PriceAlert } from './alert.models';
import { AlertForm } from './alert-form';
import { AlertNote } from './alert-note';
import { AlertsApi } from './alerts-api';
import { AlertsStore } from './alerts-store';

@Component({
  selector: 'app-alerts-page',
  imports: [AlertForm, AlertNote, CurrencyPipe, DatePipe],
  providers: [AlertsStore],
  template: `
    <label>
      Search
      <input type="search" (input)="query.set($any($event.target).value)" />
    </label>
    <app-alert-form (created)="store.add($event)" />
    @if (store.error()) {
      <p class="error">{{ store.error() }}</p>
    }
    <ul class="alerts">
      @for (alert of visible(); track $index) {
        <li>
          <strong>{{ alert.productName }}</strong> target {{ alert.targetPrice | currency }}
          @if (priceOf(alert.productId) <= alert.targetPrice) {
            <span class="hit">Target reached</span>
          }
          <app-alert-note [note]="alert.note" />
          <button type="button" (click)="store.remove(alert.id)">✕</button>
        </li>
      } @empty {
        <li>No alerts yet.</li>
      }
    </ul>
    <p class="checked">Last checked {{ lastCheck() | date: 'mediumTime' }}</p>
  `,
})
export class AlertsPage {
  private readonly api = inject(AlertsApi);
  protected readonly store = inject(AlertsStore);

  protected readonly query = signal('');
  protected readonly lastCheck = signal(new Date());
  private readonly results = toSignal(
    toObservable(this.query).pipe(mergeMap((term) => this.api.search(term))),
    { initialValue: [] as PriceAlert[] },
  );
  protected readonly visible = computed(() =>
    this.query() ? this.results() : this.store.alerts(),
  );

  constructor() {
    this.store.load();
    interval(30_000).subscribe(() => {
      this.lastCheck.set(new Date());
      this.store.load();
    });
  }

  protected priceOf(productId: number) {
    return SEED_PRODUCTS.find((p) => p.id === productId)?.price ?? Infinity;
  }
}
