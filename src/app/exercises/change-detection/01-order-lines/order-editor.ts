import { Component } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { LineList } from './line-list';
import { OrderLine } from './order-line';
import { OrderSummary } from './order-summary';

@Component({
  selector: 'app-order-editor',
  imports: [LineList, OrderSummary],
  template: `
    <h2>Order</h2>
    <app-line-list [lines]="lines" (removed)="remove($event)" />
    <button type="button" (click)="addLine()">Add next product</button>
    <app-order-summary [lines]="lines" />
  `,
})
export class OrderEditor {
  protected lines: OrderLine[] = [{ productId: 1, name: SEED_PRODUCTS[0].name, price: SEED_PRODUCTS[0].price, quantity: 1 }];

  protected addLine() {
    const product = SEED_PRODUCTS[this.lines.length % SEED_PRODUCTS.length];
    this.lines.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
  }

  protected remove(index: number) {
    this.lines.splice(index, 1);
  }
}
