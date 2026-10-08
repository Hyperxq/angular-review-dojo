import { Component, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { ProductBadge } from './product-badge';

@Component({
  selector: 'app-badge-demo',
  imports: [ProductBadge],
  template: `
    <app-product-badge [product]="product()" />
    <button type="button" (click)="sellOne()">Sell one</button>
    <button type="button" (click)="next()">Next product</button>
  `,
})
export class BadgeDemo {
  private index = 0;
  protected readonly product = signal<Product>({ ...SEED_PRODUCTS[0] });

  protected sellOne() {
    this.product.update((p) => ({ ...p, stock: p.stock - 1 }));
  }

  protected next() {
    this.index = (this.index + 1) % SEED_PRODUCTS.length;
    this.product.set({ ...SEED_PRODUCTS[this.index] });
  }
}
