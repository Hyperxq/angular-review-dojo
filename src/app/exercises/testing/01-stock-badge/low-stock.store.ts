import { Injectable, inject } from '@angular/core';
import { scan } from 'rxjs';
import { StockFeed } from '../../../core/stock-feed';

export const LOW_STOCK_THRESHOLD = 5;

@Injectable({ providedIn: 'root' })
export class LowStockStore {
  private readonly feed = inject(StockFeed);

  readonly lowStock$ = this.feed.changes$.pipe(
    scan(
      (ids, change) =>
        change.stock <= LOW_STOCK_THRESHOLD
          ? ids.includes(change.productId)
            ? ids
            : [...ids, change.productId]
          : ids.filter((id) => id !== change.productId),
      [] as number[],
    ),
  );
}
