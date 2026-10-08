import { Component, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { LineList } from './line-list';
import { OrderLine } from './order-line';
import { OrderSummary } from './order-summary';

@Component({
  selector: 'app-order-editor',
  imports: [LineList, OrderSummary],
  template: `
    <h2>Order</h2>
    <app-line-list [lines]="lines()" (removed)="remove($event)" (quantityChanged)="changeQuantity($event)" />
    <button type="button" (click)="addLine()">Add next product</button>
    <app-order-summary [lines]="lines()" />
  `,
})
export class OrderEditor {
  protected readonly lines = signal<OrderLine[]>([
    { productId: 1, name: SEED_PRODUCTS[0].name, price: SEED_PRODUCTS[0].price, quantity: 1 },
  ]);

  protected addLine() {
    this.lines.update((lines) => {
      const product = SEED_PRODUCTS[lines.length % SEED_PRODUCTS.length];
      return [...lines, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  protected remove(index: number) {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  protected changeQuantity({ index, delta }: { index: number; delta: number }) {
    this.lines.update((lines) =>
      lines.map((line, i) => (i === index ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line)),
    );
  }
}
