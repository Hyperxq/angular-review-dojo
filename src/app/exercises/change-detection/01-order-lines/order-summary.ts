import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OrderLine } from './order-line';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <p data-testid="summary">
      {{ lines.length }} lines, {{ itemCount() }} items, total {{ total() | currency }}
    </p>
  `,
})
export class OrderSummary {
  @Input({ required: true }) lines: OrderLine[] = [];

  protected itemCount() {
    return this.lines.reduce((n, line) => n + line.quantity, 0);
  }

  protected total() {
    return this.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }
}
