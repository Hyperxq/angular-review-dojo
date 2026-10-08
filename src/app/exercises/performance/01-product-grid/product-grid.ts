import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { Pricing } from './pricing';

@Component({
  selector: 'app-product-grid',
  imports: [CurrencyPipe],
  template: `
    <h2>Quick order</h2>
    <button type="button" (click)="toggleSort()">
      {{ sortedByPrice() ? 'Sort by catalog order' : 'Sort by price' }}
    </button>
    <table>
      <tbody>
        @for (row of rows(); track row.product.id) {
          <tr>
            <td>{{ row.product.name }}</td>
            <td>{{ row.price | currency }}</td>
            <td>
              <input type="number" min="0" [attr.aria-label]="'Quantity for ' + row.product.name" />
            </td>
          </tr>
        }
      </tbody>
    </table>

    <h2>Live stock</h2>
    <button type="button" (click)="refreshStock()">Refresh stock</button>
    <ul>
      @for (item of stock(); track item.id) {
        <li>{{ item.name }}: {{ item.stock }}</li>
      }
    </ul>
  `,
})
export class ProductGrid {
  protected readonly pricing = inject(Pricing);

  private readonly products = signal<Product[]>([...SEED_PRODUCTS]);
  protected readonly sortedByPrice = signal(false);
  protected readonly stock = signal<Product[]>(structuredClone([...SEED_PRODUCTS]));

  private readonly priced = computed(() =>
    this.products().map((product) => ({ product, price: this.pricing.discountedPrice(product) })),
  );

  protected readonly rows = computed(() =>
    this.sortedByPrice() ? [...this.priced()].sort((a, b) => a.price - b.price) : this.priced(),
  );

  protected toggleSort() {
    this.sortedByPrice.update((sorted) => !sorted);
  }

  protected refreshStock() {
    this.stock.set(structuredClone([...SEED_PRODUCTS]));
  }
}
