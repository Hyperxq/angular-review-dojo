import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { CartItem, Product } from '../../../core/models';

const BULK_THRESHOLD = 5;
const BULK_DISCOUNT = 0.1;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);

  readonly items$ = this.itemsSubject.asObservable();
  readonly count$ = this.items$.pipe(map((items) => items.reduce((n, i) => n + i.quantity, 0)));
  private readonly subtotal$ = this.items$.pipe(
    map((items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0)),
  );
  private readonly discountRate$ = this.count$.pipe(
    map((count) => (count >= BULK_THRESHOLD ? BULK_DISCOUNT : 0)),
  );
  readonly total$ = combineLatest([this.subtotal$, this.discountRate$]).pipe(
    map(([subtotal, rate]) => subtotal * (1 - rate)),
  );

  add(product: Product) {
    const items = this.itemsSubject.value;
    const line = items.find((item) => item.productId === product.id);
    if (line) {
      line.quantity += 1;
    } else {
      items.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    this.itemsSubject.next(items);
  }

  remove(productId: number) {
    this.itemsSubject.next(this.itemsSubject.value.filter((item) => item.productId !== productId));
  }

  clear() {
    this.itemsSubject.next([]);
  }
}
