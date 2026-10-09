import { Component, inject } from '@angular/core';
import { CartPanel } from './components/cart-panel';
import { NotificationsBar } from './components/notifications-bar';
import { ProductCard } from './components/product-card';
import { WishlistPanel } from './components/wishlist-panel';
import { ShopService } from './services/shop.service';

@Component({
  selector: 'app-shop-demo',
  imports: [ProductCard, CartPanel, WishlistPanel, NotificationsBar],
  template: `
    <app-notifications-bar />
    <input
      type="search"
      aria-label="Search products"
      (input)="shop.setQuery($any($event.target).value)"
    />
    <ul class="products">
      @for (product of shop.visibleProducts(); track product.id) {
        <li><app-product-card [product]="product" /></li>
      }
    </ul>
    <app-cart-panel />
    <app-wishlist-panel />
  `,
})
export class ShopDemo {
  protected readonly shop = inject(ShopService);
}
