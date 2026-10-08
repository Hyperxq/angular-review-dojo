import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { StockFeed } from '../../../core/stock-feed';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe],
  template: `
    <h2>Products</h2>
    @if (loading) {
      <p>Loading products…</p>
    } @else {
      <ul>
        @for (product of products; track product.id) {
          <li>
            <span>{{ product.name }}</span>
            <span>{{ product.price | currency }}</span>
            <span>{{ product.stock > 0 ? product.stock + ' in stock' : 'Out of stock' }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class ProductList implements OnInit {
  private readonly api = inject(ProductApi);
  private readonly stockFeed = inject(StockFeed);

  protected products: Product[] = [];
  protected loading = true;

  ngOnInit() {
    this.load();
    this.stockFeed.changes$.subscribe(() => {
      console.log('Stock changed, reloading products');
      this.load();
    });
  }

  private load() {
    this.api.list().subscribe((products) => {
      this.products = products;
      this.loading = false;
    });
  }
}
