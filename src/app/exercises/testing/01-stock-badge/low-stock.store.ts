import { Injectable, inject } from '@angular/core';
import { filter, map, scan } from 'rxjs';
import { StockFeed } from '../../../core/stock-feed';

export const LOW_STOCK_THRESHOLD = 5;

@Injectable({ providedIn: 'root' })
export class LowStockStore {
  private readonly feed = inject(StockFeed);

  readonly lowStock$ = this.feed.changes$.pipe(
    filter((change) => change.stock < LOW_STOCK_THRESHOLD),
    map((change) => change.productId),
    scan((ids, id) => (ids.includes(id) ? ids : [...ids, id]), [] as number[]),
  );
}
