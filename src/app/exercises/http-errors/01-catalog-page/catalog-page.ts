import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-catalog-page',
  imports: [CurrencyPipe],
  template: `
    <h2>Catalog</h2>
    @if (products.isLoading()) {
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
    stream: () => this.api.list().pipe(catchError(() => of([] as Product[]))),
  });
}
