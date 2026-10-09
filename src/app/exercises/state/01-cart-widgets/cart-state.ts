import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class CartState {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((n, i) => n + i.quantity, 0));
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));

  add(product: Product) {
    this._items.update((items) => {
      const existing = items.find((i) => i.productId === product.id);
      return existing
        ? items.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i))
        : [
            ...items,
            { productId: product.id, name: product.name, price: product.price, quantity: 1 },
          ];
    });
  }

  remove(productId: number) {
    this._items.update((items) => items.filter((i) => i.productId !== productId));
  }
}
