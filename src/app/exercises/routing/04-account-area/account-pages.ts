import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ACCOUNT_ORDERS } from './account-data';

@Component({
  selector: 'app-account-layout',
  imports: [RouterLink, RouterOutlet],
  template: `
    <h2>My account</h2>
    <nav>
      <a [routerLink]="['orders']">Orders</a>
      <a [routerLink]="['profile']">Profile</a>
    </nav>
    <router-outlet />
  `,
})
export class AccountLayout {}

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink],
  template: `
    <h3>Orders for customer {{ customerId() }}</h3>
    <ul>
      @for (order of orders(); track order.id) {
        <li>
          <a [routerLink]="['/orders', order.id]">Order #{{ order.id }}</a>
        </li>
      } @empty {
        <li>No orders yet</li>
      }
    </ul>
  `,
})
export class OrdersPage {
  readonly customerId = input<string>();
  protected readonly orders = computed(() =>
    ACCOUNT_ORDERS.filter((o) => o.customerId === this.customerId()),
  );
}

@Component({
  selector: 'app-order-detail-page',
  imports: [CurrencyPipe],
  template: `
    @if (order(); as o) {
      <h4>Order #{{ o.id }}</h4>
      <p>{{ o.item }} - {{ o.total | currency }} (customer {{ o.customerId }})</p>
    }
    <button type="button" (click)="backToList()">Back to orders</button>
  `,
})
export class OrderDetailPage {
  private readonly router = inject(Router);

  readonly orderId = input.required<string>();
  protected readonly order = computed(() =>
    ACCOUNT_ORDERS.find((o) => o.id === Number(this.orderId())),
  );

  protected backToList() {
    this.router.navigate(['orders']);
  }
}

@Component({
  selector: 'app-profile-page',
  template: `<h3>Profile</h3>`,
})
export class ProfilePage {}

@Component({
  selector: 'app-account-login',
  template: `<h2>Sign in</h2>`,
})
export class AccountLoginPage {}
