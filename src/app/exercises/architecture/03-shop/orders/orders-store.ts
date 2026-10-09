import { Service, inject, signal } from '@angular/core';
import { CartLine, CartStore } from '../cart';
import { NotificationsStore } from '../notifications';
import { formatPrice } from '../shared/money';

export interface PlacedOrder {
  id: number;
  lines: CartLine[];
  total: number;
}

@Service()
export class OrdersStore {
  private readonly cart = inject(CartStore);
  private readonly notifications = inject(NotificationsStore);
  private readonly _placed = signal<PlacedOrder[]>([]);

  readonly placed = this._placed.asReadonly();

  place() {
    const lines = this.cart.lines();
    if (lines.length === 0) {
      return;
    }
    const order = { id: this._placed().length + 1, lines, total: this.cart.total() };
    this._placed.update((list) => [...list, order]);
    this.cart.clear();
    this.notifications.notify(`Order #${order.id} placed: ${formatPrice(order.total)}`);
  }
}
