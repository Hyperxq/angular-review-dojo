import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { DraftOrder, OrderMath } from './order-math';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <p>{{ itemCount() }} items</p>
    <dl>
      <dt>Subtotal</dt>
      <dd data-testid="subtotal">{{ math.subtotal(order()) | currency }}</dd>
      <dt>Tax</dt>
      <dd data-testid="tax">{{ math.tax(order()) | currency }}</dd>
      <dt>Total</dt>
      <dd data-testid="total">{{ math.total(order()) | currency }}</dd>
    </dl>
  `,
})
export class OrderSummary {
  protected readonly math = inject(OrderMath);

  readonly order = input.required<DraftOrder>();
  protected readonly itemCount = signal(0);

  constructor() {
    effect(() => {
      this.itemCount.set(this.order().lines.reduce((count, line) => count + line.quantity, 0));
    });
  }
}
