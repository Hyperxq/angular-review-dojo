import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, switchMap, timer } from 'rxjs';
import { ProductApi } from '../../../core/product-api';

const REFRESH_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PriceWatch {
  private readonly api = inject(ProductApi);
  private readonly prices = new Map<number, Observable<number>>();

  price$(productId: number): Observable<number> {
    let price$ = this.prices.get(productId);
    if (!price$) {
      price$ = timer(0, REFRESH_MS).pipe(
        switchMap(() => this.api.get(productId)),
        map((product) => product.price),
        shareReplay(1),
      );
      this.prices.set(productId, price$);
    }
    return price$;
  }
}
