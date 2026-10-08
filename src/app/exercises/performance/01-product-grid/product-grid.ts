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
        @for (product of rows(); track $index) {
          <tr>
            <td>{{ product.name }}</td>
            <td>{{ pricing.discountedPrice(product) | currency }}</td>
            <td>
              <input type="number" min="0" [attr.aria-label]="'Quantity for ' + product.name" />
            </td>
          </tr>
        }
      </tbody>
    </table>

    <h2>Live stock</h2>
    <button type="button" (click)="refreshStock()">Refresh stock</button>
    <ul>
      @for (item of stock(); track item) {
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

  protected readonly rows = computed(() =>
    this.sortedByPrice() ? [...this.products()].sort((a, b) => a.price - b.price) : this.products(),
  );

  protected toggleSort() {
    this.sortedByPrice.update((sorted) => !sorted);
  }

  protected refreshStock() {
    this.stock.set(structuredClone([...SEED_PRODUCTS]));
  }
}
