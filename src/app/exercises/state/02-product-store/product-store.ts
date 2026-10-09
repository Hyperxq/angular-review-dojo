import { effect, inject, computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

interface ProductState {
  products: Product[];
  selected: Product | null;
  filter: string;
  visible: Product[];
  loading: boolean;
}

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState<ProductState>({
    products: [],
    selected: null,
    filter: '',
    visible: [],
    loading: false,
  }),
  withComputed(({ products }) => ({
    count: computed(() => products().length),
    inventoryValue: computed(() => products().reduce((sum, p) => sum + p.price * p.stock, 0)),
  })),
  withMethods((store, api = inject(ProductApi)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => api.list()),
        tap((products) => patchState(store, { products, loading: false })),
      ),
    ),
    select(id: number) {
      patchState(store, { selected: store.products().find((p) => p.id === id) ?? null });
    },
    setFilter(filter: string) {
      patchState(store, { filter });
    },
    add(product: Product) {
      patchState(store, (state) => {
        state.products.push(product);
        return state;
      });
    },
    updatePrice(id: number, price: number) {
      patchState(store, (state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, price } : p)),
      }));
    },
    remove(id: number) {
      patchState(store, (state) => ({ products: state.products.filter((p) => p.id !== id) }));
    },
  })),
  withHooks({
    onInit(store) {
      effect(() => {
        const term = store.filter().toLowerCase();
        patchState(store, {
          visible: store.products().filter((p) => p.name.toLowerCase().includes(term)),
        });
      });
    },
  }),
);
