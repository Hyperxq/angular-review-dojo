import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { StockFeed } from '../../../core/stock-feed';
import { LowStockStore } from './low-stock.store';
import { StockBadge } from './stock-badge';

@Component({
  selector: 'app-stock-overview',
  imports: [StockBadge, AsyncPipe],
  template: `
    <h2>Stock</h2>
    <ul>
      @for (product of products; track product.id) {
        <li>{{ product.name }} <app-stock-badge [stock]="product.stock" /></li>
      }
    </ul>
    <button type="button" (click)="sell()">Sell one Keychron</button>
    <p>Running low (product ids): {{ (lowStock.lowStock$ | async) ?? [] }}</p>
  `,
})
export class StockOverview {
  protected readonly lowStock = inject(LowStockStore);
  private readonly feed = inject(StockFeed);
  protected readonly products = SEED_PRODUCTS;
  private remaining = SEED_PRODUCTS[0].stock;

  protected sell() {
    this.feed.changes$.next({ productId: SEED_PRODUCTS[0].id, stock: --this.remaining });
  }
}
