import { CurrencyPipe } from '@angular/common';
import { Component, Injectable, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SEED_PRODUCTS } from '../../../core/fake-backend';

@Injectable({ providedIn: 'root' })
export class CartState {
  private readonly productIds = signal<number[]>([]);
  readonly count = computed(() => this.productIds().length);

  add(productId: number) {
    this.productIds.update((ids) => [...ids, productId]);
  }
}

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h2>Products</h2>
    <a [routerLink]="['new']">Add a product</a>
    <ul>
      @for (product of products; track product.id) {
        <li>
          <a [routerLink]="[product.id]">{{ product.name }}</a>
          {{ product.price | currency }}
        </li>
      }
    </ul>
  `,
})
export class ProductsPage {
  protected readonly products = SEED_PRODUCTS;
}

@Component({
  selector: 'app-shop-product-page',
  template: `
    @if (product(); as p) {
      <h2>{{ p.name }}</h2>
      <button type="button" (click)="cart.add(p.id)">Add to cart</button>
    } @else {
      <h2>Product not found</h2>
    }
  `,
})
export class ProductPage {
  readonly id = input.required<string>();
  protected readonly cart = inject(CartState);
  protected readonly product = computed(() => SEED_PRODUCTS.find((p) => p.id === Number(this.id())));
}

@Component({
  selector: 'app-new-product-page',
  template: `
    <h2>New product</h2>
    <label>Name <input name="name" /></label>
  `,
})
export class NewProductPage {}

@Component({
  selector: 'app-checkout-page',
  template: `<h2>Checkout</h2>`,
})
export class CheckoutPage {}

@Component({
  selector: 'app-account-page',
  template: `<h2>Your account</h2>`,
})
export class AccountPage {}

@Component({
  selector: 'app-not-found-page',
  template: `<h2>Page not found</h2>`,
})
export class NotFoundPage {}
