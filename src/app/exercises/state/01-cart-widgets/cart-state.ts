import { Injectable, signal } from '@angular/core';
import { CartItem, Product } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class CartState {
  readonly items = signal<CartItem[]>([]);
  readonly total = signal(0);
  readonly count = signal(0);

  add(product: Product) {
    this.items.update((items) => {
      const existing = items.find((i) => i.productId === product.id);
      return existing
        ? items.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i))
        : [
            ...items,
            { productId: product.id, name: product.name, price: product.price, quantity: 1 },
          ];
    });
    this.total.update((total) => total + product.price);
    this.count.update((count) => count + 1);
  }

  remove(productId: number) {
    this.items.update((items) => items.filter((i) => i.productId !== productId));
  }
}
