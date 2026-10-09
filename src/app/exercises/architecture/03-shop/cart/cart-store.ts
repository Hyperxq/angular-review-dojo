import { Service, computed, inject, signal } from '@angular/core';
import { Product } from '../../../../core/models';
import { NotificationsStore } from '../notifications';

export interface CartLine {
  product: Product;
  quantity: number;
}

@Service()
export class CartStore {
  private readonly notifications = inject(NotificationsStore);
  private readonly _lines = signal<CartLine[]>([]);

  readonly lines = this._lines.asReadonly();
  readonly count = computed(() => this._lines().reduce((n, l) => n + l.quantity, 0));
  readonly total = computed(() =>
    this._lines().reduce((sum, l) => sum + l.product.price * l.quantity, 0),
  );

  add(product: Product) {
    this._lines.update((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      return existing
        ? lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines, { product, quantity: 1 }];
    });
    this.notifications.notify(`${product.name} added to your cart`);
  }

  remove(productId: number) {
    this._lines.update((lines) => lines.filter((l) => l.product.id !== productId));
  }

  clear() {
    this._lines.set([]);
  }
}
