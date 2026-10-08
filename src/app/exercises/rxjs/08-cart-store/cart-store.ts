import { Injectable, inject } from '@angular/core';
import { Subject, scan, shareReplay, startWith, switchMap, timer } from 'rxjs';
import { CartItem, Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

export interface CartState {
  items: CartItem[];
  stock: Record<number, number>;
}

type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'remove'; productId: number }
  | { type: 'stock'; levels: Record<number, number> };

const POLL_MS = 5_000;

function createInitialState(): CartState {
  return { items: [], stock: {} };
}

function reduce(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const available = state.stock[product.id] ?? product.stock;
      if (available <= 0) {
        return state;
      }
      const line = state.items.find((item) => item.productId === product.id);
      if (line) {
        line.quantity += 1;
      } else {
        state.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        });
      }
      state.stock[product.id] = available - 1;
      return state;
    }
    case 'remove': {
      const index = state.items.findIndex((item) => item.productId === action.productId);
      if (index >= 0) {
        state.items.splice(index, 1);
      }
      return state;
    }
    case 'stock':
      state.stock = action.levels;
      return state;
  }
}

@Injectable()
export class CartStore {
  private readonly api = inject(ProductApi);
  private readonly actions$ = new Subject<CartAction>();

  readonly state$ = this.actions$.pipe(
    scan(reduce, createInitialState()),
    startWith(createInitialState()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    timer(0, POLL_MS)
      .pipe(switchMap(() => this.api.stock()))
      .subscribe((levels) => this.actions$.next({ type: 'stock', levels }));
  }

  add(product: Product) {
    this.actions$.next({ type: 'add', product });
    this.api.reserve(product.id).subscribe();
  }

  remove(productId: number) {
    this.actions$.next({ type: 'remove', productId });
  }
}
