import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SkuApi {
  /** Stand-in for GET /api/skus/:sku/availability. */
  isAvailable(sku: string): Observable<boolean> {
    return of(!sku.toUpperCase().startsWith('SOLD')).pipe(delay(150));
  }
}
