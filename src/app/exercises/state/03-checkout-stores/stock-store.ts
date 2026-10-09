import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ProductApi } from '../../../core/product-api';

export const StockStore = signalStore(
  { providedIn: 'root' },
  withState({ stock: {} as Record<number, number> }),
  withMethods((store, api = inject(ProductApi)) => ({
    load: rxMethod<void>(
      pipe(
        switchMap(() => api.stock()),
        tap((stock) => patchState(store, { stock })),
      ),
    ),
    snapshot: () => ({ ...store.stock() }),
    restore: (stock: Record<number, number>) => patchState(store, { stock }),
    take(productId: number) {
      patchState(store, (state) => ({
        stock: { ...state.stock, [productId]: state.stock[productId] - 1 },
      }));
    },
  })),
);
