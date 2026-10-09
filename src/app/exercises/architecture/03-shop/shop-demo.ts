import { Component, inject } from '@angular/core';
import { CartPanel } from './cart';
import { CatalogStore, ProductCard } from './catalog';
import { NotificationsBar } from './notifications';
import { OrdersPanel } from './orders';
import { WishlistPanel } from './wishlist';

@Component({
  selector: 'app-shop-demo',
  imports: [ProductCard, CartPanel, OrdersPanel, WishlistPanel, NotificationsBar],
  template: `
    <app-notifications-bar />
    <input
      type="search"
      aria-label="Search products"
      (input)="catalog.query.set($any($event.target).value)"
    />
    <ul class="products">
      @for (product of catalog.visible(); track product.id) {
        <li><app-product-card [product]="product" /></li>
      }
    </ul>
    <app-cart-panel />
    <app-orders-panel />
    <app-wishlist-panel />
  `,
})
export class ShopDemo {
  protected readonly catalog = inject(CatalogStore);
}
