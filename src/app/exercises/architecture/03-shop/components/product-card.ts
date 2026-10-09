import { Component, inject, input } from '@angular/core';
import { Product } from '../../../../core/models';
import { ShopService } from '../services/shop.service';

@Component({
  selector: 'app-product-card',
  template: `
    <span class="name">{{ product().name }}</span>
    <span class="price">{{ shop.formatPrice(product().price) }}</span>
    <button type="button" class="add" (click)="shop.addToCart(product())">
      Add {{ product().name }} to cart
    </button>
    <button
      type="button"
      class="wish"
      [attr.aria-pressed]="shop.isWished(product().id)"
      (click)="shop.toggleWishlist(product())"
    >
      Wishlist {{ product().name }}
    </button>
  `,
})
export class ProductCard {
  protected readonly shop = inject(ShopService);
  readonly product = input.required<Product>();
}
