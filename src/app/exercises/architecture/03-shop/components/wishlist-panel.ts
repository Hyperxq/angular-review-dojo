import { Component, inject } from '@angular/core';
import { ShopService } from '../services/shop.service';

@Component({
  selector: 'app-wishlist-panel',
  template: `
    <h3>Wishlist</h3>
    <ul class="wishlist">
      @for (product of shop.wishlist(); track product.id) {
        <li>{{ product.name }}</li>
      }
    </ul>
  `,
})
export class WishlistPanel {
  protected readonly shop = inject(ShopService);
}
