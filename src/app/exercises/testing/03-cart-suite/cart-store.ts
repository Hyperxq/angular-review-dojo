import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export const CART_STORAGE_KEY = 'dojo.cart';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly state = signal<CartLine[]>([]);
  private persistTimer?: ReturnType<typeof setTimeout>;

  readonly items = this.state.asReadonly();
  readonly count = computed(() => this.state().reduce((n, line) => n + line.quantity, 0));
  readonly total = computed(
    () => Math.round(this.state().reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100,
  );

  add(product: { id: number; name: string; price: number }) {
    this.state.update((lines) =>
      lines.some((line) => line.productId === product.id)
        ? lines.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line))
        : [...lines, { productId: product.id, name: product.name, price: product.price, quantity: 1 }],
    );
    this.persist();
  }

  remove(productId: number) {
    this.state.update((lines) => lines.filter((line) => line.productId !== productId));
    this.persist();
  }

  private persist() {
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.state()));
    }, 50);
  }
}
