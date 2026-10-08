import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Subject,
  catchError,
  distinctUntilChanged,
  exhaustMap,
  fromEvent,
  map,
  scan,
  shareReplay,
  startWith,
  switchMap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { CartItem, Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

export interface CartState {
  items: CartItem[];
  stock: Record<number, number>;
  /** Incremented on every local change. */
  version: number;
}

type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'remove'; productId: number }
  | { type: 'release'; product: Product }
  | { type: 'stock'; levels: Record<number, number>; requestedAtVersion: number };

const POLL_MS = 5_000;

function createInitialState(): CartState {
  return { items: [], stock: {}, version: 0 };
}

function reduce(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const available = state.stock[product.id] ?? product.stock;
      if (available <= 0) {
        return state;
      }
      const exists = state.items.some((item) => item.productId === product.id);
      return {
        items: exists
          ? state.items.map((item) =>
              item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            )
          : [
              ...state.items,
              { productId: product.id, name: product.name, price: product.price, quantity: 1 },
            ],
        stock: { ...state.stock, [product.id]: available - 1 },
        version: state.version + 1,
      };
    }
    case 'release': {
      const { product } = action;
      return {
        items: state.items
          .map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity - 1 } : item,
          )
          .filter((item) => item.quantity > 0),
        stock: { ...state.stock, [product.id]: (state.stock[product.id] ?? product.stock) + 1 },
        version: state.version + 1,
      };
    }
    case 'remove':
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.productId),
        version: state.version + 1,
      };
    case 'stock':
      return action.requestedAtVersion < state.version
        ? state
        : { ...state, stock: action.levels };
  }
}

@Injectable()
export class CartStore {
  private readonly api = inject(ProductApi);
  private readonly document = inject(DOCUMENT);
  private readonly actions$ = new Subject<CartAction>();

  readonly state$ = this.actions$.pipe(
    scan(reduce, createInitialState()),
    startWith(createInitialState()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    const visible$ = fromEvent(this.document, 'visibilitychange').pipe(
      startWith(null),
      map(() => !this.document.hidden),
      distinctUntilChanged(),
    );

    visible$
      .pipe(
        switchMap((visible) => (visible ? timer(0, POLL_MS) : EMPTY)),
        withLatestFrom(this.state$),
        exhaustMap(([, { version }]) =>
          this.api.stock().pipe(
            map((levels): CartAction => ({ type: 'stock', levels, requestedAtVersion: version })),
            catchError(() => EMPTY),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((action) => this.actions$.next(action));
  }

  add(product: Product) {
    this.actions$.next({ type: 'add', product });
    this.api
      .reserve(product.id)
      .pipe(
        catchError(() => {
          this.actions$.next({ type: 'release', product });
          return EMPTY;
        }),
      )
      .subscribe();
  }

  remove(productId: number) {
    this.actions$.next({ type: 'remove', productId });
  }
}
