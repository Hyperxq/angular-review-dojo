import { Component, inject, input } from '@angular/core';
import { Product } from '../../../../core/models';
import { CartStore } from '../cart';
import { formatPrice } from '../shared/money';
import { WishlistStore } from '../wishlist';

@Component({
  selector: 'app-product-card',
  template: `
    <span class="name">{{ product().name }}</span>
    <span class="price">{{ price(product().price) }}</span>
    <button type="button" class="add" (click)="cart.add(product())">
      Add {{ product().name }} to cart
    </button>
    <button
      type="button"
      class="wish"
      [attr.aria-pressed]="wishlist.has(product().id)"
      (click)="wishlist.toggle(product())"
    >
      Wishlist {{ product().name }}
    </button>
  `,
})
export class ProductCard {
  protected readonly cart = inject(CartStore);
  protected readonly wishlist = inject(WishlistStore);
  protected readonly price = formatPrice;

  readonly product = input.required<Product>();
}
