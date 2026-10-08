import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { merge, of, switchMap } from 'rxjs';
import { ProductApi } from '../../../core/product-api';
import { StockFeed } from '../../../core/stock-feed';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe],
  template: `
    <h2>Products</h2>
    @if (products(); as products) {
      <ul>
        @for (product of products; track product.id) {
          <li>
            <span>{{ product.name }}</span>
            <span>{{ product.price | currency }}</span>
            <span>{{ product.stock > 0 ? product.stock + ' in stock' : 'Out of stock' }}</span>
          </li>
        }
      </ul>
    } @else {
      <p>Loading products…</p>
    }
  `,
})
export class ProductList {
  private readonly api = inject(ProductApi);
  private readonly stockFeed = inject(StockFeed);

  protected readonly products = toSignal(
    merge(of(undefined), this.stockFeed.changes$).pipe(switchMap(() => this.api.list())),
  );
}
