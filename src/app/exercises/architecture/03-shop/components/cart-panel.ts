import { Component, inject } from '@angular/core';
import { ShopService } from '../services/shop.service';

@Component({
  selector: 'app-cart-panel',
  template: `
    <h3>Cart</h3>
    <p class="cart-count">Cart ({{ shop.cartCount() }})</p>
    <ul class="cart-lines">
      @for (line of shop.cart(); track line.product.id) {
        <li>
          {{ line.quantity }} x {{ line.product.name }}
          <button type="button" (click)="shop.removeFromCart(line.product.id)">
            Remove {{ line.product.name }}
          </button>
        </li>
      }
    </ul>
    <p class="cart-total">Total {{ shop.formatPrice(shop.cartTotal()) }}</p>
    <button type="button" class="place" (click)="shop.placeOrder()">Place order</button>
    <p class="orders-count">Orders: {{ shop.orders().length }}</p>
  `,
})
export class CartPanel {
  protected readonly shop = inject(ShopService);
}
