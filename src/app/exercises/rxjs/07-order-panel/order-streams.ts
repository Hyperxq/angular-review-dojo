import { Observable, exhaustMap, map, withLatestFrom } from 'rxjs';
import { Order, OrderReceipt, Product } from '../../../core/models';

export interface OrderLineDraft {
  product: Product;
  quantity: number;
}

export function lineTotal$(line$: Observable<OrderLineDraft>): Observable<number> {
  return line$.pipe(map((line) => line.product.price * line.quantity));
}

export function placeOrder$(
  click$: Observable<void>,
  line$: Observable<OrderLineDraft>,
  submit: (order: Order) => Observable<OrderReceipt>,
): Observable<OrderReceipt> {
  return click$.pipe(
    withLatestFrom(line$),
    exhaustMap(([, line]) =>
      submit({ lines: [{ productId: line.product.id, quantity: line.quantity }] }),
    ),
  );
}
