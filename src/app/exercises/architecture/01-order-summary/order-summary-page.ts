import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrderLine } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { PricedLine } from './order-pricing';
import { OrderSummary } from './order-summary';

@Component({
  selector: 'app-order-summary-page',
  imports: [OrderSummary],
  template: `
    <h2>Review your order</h2>
    @if (lines().length) {
      <app-order-summary
        [lines]="lines()"
        [stock]="stock.hasValue() ? stock.value() : {}"
        (confirm)="confirmed.set(true)"
      />
    }
    @if (confirmed()) {
      <p class="done">Order confirmed.</p>
    }
  `,
})
export class OrderSummaryPage {
  private readonly api = inject(ProductApi);
  private readonly order: OrderLine[] = [
    { productId: 1, quantity: 2 },
    { productId: 6, quantity: 1 },
  ];

  protected readonly confirmed = signal(false);
  private readonly products = rxResource({ stream: () => this.api.list() });
  protected readonly stock = rxResource({ stream: () => this.api.stock() });
  protected readonly lines = computed<PricedLine[]>(() => {
    const products = this.products.hasValue() ? this.products.value() : [];
    return this.order.flatMap((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product
        ? [
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              quantity: line.quantity,
            },
          ]
        : [];
    });
  });
}
