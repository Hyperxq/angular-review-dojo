import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { PriceWatch } from './price-watch';
import { SelectionStore } from './selection-store';

@Component({
  selector: 'app-catalog-stats',
  imports: [AsyncPipe, CurrencyPipe],
  template: `
    <h2>Catalog overview</h2>
    <p>Products: {{ (products$ | async)?.length }}</p>
    <p>Inventory value: {{ inventoryValue(products$ | async) | currency }}</p>
    <ul>
      @for (product of products$ | async; track product.id) {
        <li>
          <button type="button" (click)="selection.select(product)">{{ product.name }}</button>
        </li>
      }
    </ul>
    @if (selection.selected$ | async; as selected) {
      <section>
        <h3>{{ selected.name }}</h3>
        <p>Live price: {{ priceWatch.price$(selected.id) | async | currency }}</p>
      </section>
    }
  `,
})
export class CatalogStats {
  protected readonly selection = inject(SelectionStore);
  protected readonly priceWatch = inject(PriceWatch);

  protected readonly products$ = inject(ProductApi).list();

  protected inventoryValue(products: Product[] | null) {
    return (products ?? []).reduce((sum, p) => sum + p.price * p.stock, 0);
  }
}
