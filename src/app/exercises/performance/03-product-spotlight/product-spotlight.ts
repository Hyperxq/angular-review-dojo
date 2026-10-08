import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input } from '@angular/core';
import { Product } from '../../../core/models';
import { Analytics, SpotlightCart } from './spotlight-services';

@Component({
  selector: 'app-product-spotlight',
  imports: [CurrencyPipe],
  template: `
    @if (promoVisible) {
      <p role="status">Free shipping on orders over $50 this week</p>
    }
    @if (!online) {
      <p role="alert">You are offline. Prices may be out of date.</p>
    }
    <img src="spotlight-hero.jpg" alt="Product on a desk" width="1200" height="600" />
    <h2>{{ product().name }}</h2>
    <p>{{ product().price | currency }}</p>
    <button type="button" (click)="cart.add()">Add to cart ({{ cart.count() }})</button>
  `,
})
export class ProductSpotlight {
  protected readonly cart = inject(SpotlightCart);
  private readonly analytics = inject(Analytics);

  readonly product = input.required<Product>();

  protected promoVisible = true;
  protected online = true;

  constructor() {
    setTimeout(() => {
      this.promoVisible = false;
    }, 3000);
    window.addEventListener('offline', () => (this.online = false));
    window.addEventListener('online', () => (this.online = true));

    effect(() => {
      this.analytics.track('spotlight_view', {
        productId: this.product().id,
        cartSize: this.cart.count(),
      });
    });
  }
}
