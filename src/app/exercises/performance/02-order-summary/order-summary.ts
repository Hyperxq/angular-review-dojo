import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { DraftOrder, OrderMath } from './order-math';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <p>{{ totals().itemCount }} items</p>
    <dl>
      <dt>Subtotal</dt>
      <dd data-testid="subtotal">{{ totals().subtotal | currency }}</dd>
      <dt>Tax</dt>
      <dd data-testid="tax">{{ totals().tax | currency }}</dd>
      <dt>Total</dt>
      <dd data-testid="total">{{ totals().total | currency }}</dd>
    </dl>
  `,
})
export class OrderSummary {
  protected readonly math = inject(OrderMath);

  readonly order = input.required<DraftOrder>();
  protected readonly totals = computed(() => {
    const order = this.order();
    const subtotal = this.math.subtotal(order);
    const tax = subtotal * OrderMath.TAX_RATE;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      itemCount: order.lines.reduce((count, line) => count + line.quantity, 0),
    };
  });
}
