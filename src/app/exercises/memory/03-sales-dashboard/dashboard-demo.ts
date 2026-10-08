import { Component, signal } from '@angular/core';
import { SalesDashboard } from './sales-dashboard';

@Component({
  selector: 'app-dashboard-demo',
  imports: [SalesDashboard],
  template: `
    <button type="button" (click)="shown.update((s) => !s)">{{ shown() ? 'Hide' : 'Show' }} dashboard</button>
    <button type="button" (click)="refresh()">New data</button>
    @if (shown()) {
      <app-sales-dashboard [series]="series()" />
    }
  `,
})
export class DashboardDemo {
  protected readonly shown = signal(true);
  protected readonly series = signal(Array.from({ length: 400 }, (_, i) => 50 + (i % 17)));

  protected refresh() {
    this.series.set(Array.from({ length: 400 }, () => Math.round(40 + Math.random() * 40)));
  }
}
