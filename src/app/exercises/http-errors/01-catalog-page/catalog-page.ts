import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-catalog-page',
  imports: [CurrencyPipe],
  template: `
    <h2>Catalog</h2>
    @if (products.error()) {
      <div role="alert">
        <p>We could not load the products.</p>
        <button type="button" (click)="products.reload()">Try again</button>
      </div>
    } @else if (products.isLoading()) {
      <p class="loading">Loading…</p>
    } @else {
      <ul class="products">
        @for (product of products.value(); track product.id) {
          <li>{{ product.name }} {{ product.price | currency }}</li>
        } @empty {
          <li class="empty">No products found.</li>
        }
      </ul>
    }
  `,
})
export class CatalogPage {
  private readonly api = inject(ProductApi);

  protected readonly products = rxResource({
    stream: () => this.api.list(),
  });
}
