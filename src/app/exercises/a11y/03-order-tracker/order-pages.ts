import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDERS } from './orders';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink],
  template: `
    <h2>Order #{{ id() }}</h2>
    <p>Status: {{ status() }}</p>
    <a routerLink="..">Back to orders</a>
  `,
})
export class OrderDetail {
  readonly id = input.required<string>();

  protected status() {
    return ORDERS.find((o) => o.id === Number(this.id()))?.status ?? 'unknown';
  }
}

@Component({
  selector: 'app-order-help',
  template: `
    <h2>Help with orders</h2>
    <p>Orders ship within two business days.</p>
  `,
})
export class OrderHelp {}
