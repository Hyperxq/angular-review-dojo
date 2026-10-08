import { Component, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { DraftOrder } from './order-math';
import { OrderSummary } from './order-summary';

@Component({
  selector: 'app-order-page',
  imports: [OrderSummary],
  template: `
    <h2>New order</h2>
    <ul>
      @for (line of order().lines; track line.productId) {
        <li>{{ line.quantity }} x {{ line.name }}</li>
      }
    </ul>
    <button type="button" (click)="addNext()">Add next product</button>
    <app-order-summary [order]="order()" />
  `,
})
export class OrderPage {
  protected readonly order = signal<DraftOrder>({ lines: [] });

  protected addNext() {
    const lines = this.order().lines;
    const product = SEED_PRODUCTS[lines.length % SEED_PRODUCTS.length];
    lines.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
  }
}
