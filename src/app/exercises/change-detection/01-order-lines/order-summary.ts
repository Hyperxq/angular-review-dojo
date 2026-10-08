import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { OrderLine } from './order-line';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <p data-testid="summary">
      {{ lines().length }} lines, {{ itemCount() }} items, total {{ total() | currency }}
    </p>
  `,
})
export class OrderSummary {
  readonly lines = input.required<OrderLine[]>();

  protected readonly itemCount = computed(() => this.lines().reduce((n, line) => n + line.quantity, 0));
  protected readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.price * line.quantity, 0),
  );
}
