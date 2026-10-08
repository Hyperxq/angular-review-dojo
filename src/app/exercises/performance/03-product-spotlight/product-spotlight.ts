import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { Product } from '../../../core/models';
import { Analytics, SpotlightCart } from './spotlight-services';

@Component({
  selector: 'app-product-spotlight',
  imports: [CurrencyPipe, NgOptimizedImage],
  host: {
    '(window:offline)': 'online.set(false)',
    '(window:online)': 'online.set(true)',
  },
  template: `
    @if (promoVisible()) {
      <p role="status">Free shipping on orders over $50 this week</p>
    }
    @if (!online()) {
      <p role="alert">You are offline. Prices may be out of date.</p>
    }
    <img ngSrc="spotlight-hero.jpg" alt="Product on a desk" width="1200" height="600" priority />
    <h2>{{ product().name }}</h2>
    <p>{{ product().price | currency }}</p>
    <button type="button" (click)="cart.add()">Add to cart ({{ cart.count() }})</button>
  `,
})
export class ProductSpotlight {
  protected readonly cart = inject(SpotlightCart);
  private readonly analytics = inject(Analytics);

  readonly product = input.required<Product>();

  protected readonly promoVisible = signal(true);
  protected readonly online = signal(true);

  constructor() {
    const promoTimer = setTimeout(() => this.promoVisible.set(false), 3000);
    inject(DestroyRef).onDestroy(() => clearTimeout(promoTimer));

    effect(() => {
      const productId = this.product().id;
      untracked(() =>
        this.analytics.track('spotlight_view', { productId, cartSize: this.cart.count() }),
      );
    });
  }
}
