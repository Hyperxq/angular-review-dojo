import { Component, inject } from '@angular/core';
import { WishlistStore } from './wishlist-store';

@Component({
  selector: 'app-wishlist-panel',
  template: `
    <h3>Wishlist</h3>
    <ul class="wishlist">
      @for (product of wishlist.items(); track product.id) {
        <li>{{ product.name }}</li>
      }
    </ul>
  `,
})
export class WishlistPanel {
  protected readonly wishlist = inject(WishlistStore);
}
