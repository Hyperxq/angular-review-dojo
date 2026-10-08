import { Component, computed, input, linkedSignal } from '@angular/core';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-badge',
  template: `
    <h3>{{ product().name }}</h3>
    <span class="tag">{{ tag() }}</span>
    @if (discountLabel()) {
      <span class="discount">{{ discountLabel() }}</span>
    }
    <button type="button" (click)="expanded.update((open) => !open)">Details</button>
    @if (expanded()) {
      <p class="details">{{ product().stock }} units left</p>
    }
  `,
})
export class ProductBadge {
  readonly product = input.required<Product>();

  protected readonly tag = computed(() => this.product().category.toUpperCase());
  protected readonly discountLabel = computed(() => (this.product().stock <= 2 ? '20% off' : ''));
  protected readonly expanded = linkedSignal({ source: this.product, computation: () => false });
}
