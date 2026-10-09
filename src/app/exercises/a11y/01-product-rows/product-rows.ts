import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-rows',
  imports: [CurrencyPipe],
  template: `
    <input
      class="search"
      type="search"
      aria-label="Search products"
      placeholder="Search products"
      (input)="query.set($any($event.target).value)"
    />
    <ul class="rows">
      @for (product of visible(); track product.id) {
        <li class="row">
          <button type="button" class="name" (click)="select(product)">
            {{ product.name }} <span class="price">{{ product.price | currency }}</span>
          </button>
          <input
            class="qty"
            type="number"
            min="1"
            value="1"
            [attr.aria-label]="'Quantity for ' + product.name"
          />
          <button
            type="button"
            class="icon"
            [attr.aria-label]="
              wishlist().has(product.id)
                ? 'Remove ' + product.name + ' from wishlist'
                : 'Add ' + product.name + ' to wishlist'
            "
            (click)="toggleWishlist(product)"
          >
            <span aria-hidden="true">{{ wishlist().has(product.id) ? '♥' : '♡' }}</span>
          </button>
          <button
            type="button"
            class="icon"
            [attr.aria-label]="'Remove ' + product.name"
            (click)="remove(product)"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </li>
      }
    </ul>
    @if (selected(); as product) {
      <p class="selected">Selected: {{ product.name }}</p>
    }
  `,
  styles: `
    .row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .name {
      background: none;
      border: 0;
      cursor: pointer;
      flex: 1;
      font: inherit;
      text-align: left;
    }
    .icon {
      background: none;
      border: 0;
      cursor: pointer;
      font-size: 1.25rem;
    }
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid #1a56db;
      outline-offset: 2px;
    }
  `,
})
export class ProductRows {
  protected readonly products = signal<Product[]>(SEED_PRODUCTS.slice(0, 4).map((p) => ({ ...p })));
  protected readonly query = signal('');
  protected readonly selected = signal<Product | null>(null);
  protected readonly wishlist = signal<ReadonlySet<number>>(new Set());

  protected readonly visible = computed(() => {
    const term = this.query().toLowerCase();
    return this.products().filter((p) => p.name.toLowerCase().includes(term));
  });

  protected select(product: Product) {
    this.selected.set(product);
  }

  protected toggleWishlist(product: Product) {
    this.wishlist.update((set) => {
      const next = new Set(set);
      if (!next.delete(product.id)) {
        next.add(product.id);
      }
      return next;
    });
  }

  protected remove(product: Product) {
    this.products.update((list) => list.filter((p) => p.id !== product.id));
  }
}
