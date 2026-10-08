import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';
import { PriceWatch } from './price-watch';
import { SelectionStore } from './selection-store';

@Component({
  selector: 'app-catalog-stats',
  imports: [AsyncPipe, CurrencyPipe],
  template: `
    <h2>Catalog overview</h2>
    <p>Products: {{ products().length }}</p>
    <p>Inventory value: {{ inventoryValue() | currency }}</p>
    <ul>
      @for (product of products(); track product.id) {
        <li>
          <button type="button" (click)="selection.select(product)">{{ product.name }}</button>
        </li>
      }
    </ul>
    @if (selected(); as selected) {
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

  protected readonly products = toSignal(inject(ProductApi).list(), { initialValue: [] });
  protected readonly selected = toSignal(this.selection.selected$);
  protected readonly inventoryValue = computed(() =>
    this.products().reduce((sum, p) => sum + p.price * p.stock, 0),
  );
}
