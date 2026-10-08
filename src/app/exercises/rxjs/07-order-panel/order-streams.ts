import { Observable, combineLatest, exhaustMap, map } from 'rxjs';
import { Order, OrderReceipt, Product } from '../../../core/models';

export interface OrderLineDraft {
  product: Product;
  quantity: number;
}

export function lineTotal$(line$: Observable<OrderLineDraft>): Observable<number> {
  return combineLatest([
    line$.pipe(map((line) => line.product)),
    line$.pipe(map((line) => line.quantity)),
  ]).pipe(map(([product, quantity]) => product.price * quantity));
}

export function placeOrder$(
  click$: Observable<void>,
  line$: Observable<OrderLineDraft>,
  submit: (order: Order) => Observable<OrderReceipt>,
): Observable<OrderReceipt> {
  return combineLatest([click$, line$]).pipe(
    exhaustMap(([, line]) =>
      submit({ lines: [{ productId: line.product.id, quantity: line.quantity }] }),
    ),
  );
}
