import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CartLine } from './cart-store';

@Component({
  selector: 'app-cart-line-row',
  imports: [CurrencyPipe],
  template: `{{ line().name }} x{{ line().quantity }} - {{ line().price * line().quantity | currency }}`,
})
export class CartLineRow {
  readonly line = input.required<CartLine>();
}
