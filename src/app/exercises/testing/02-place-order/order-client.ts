import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Order, OrderReceipt } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class OrderClient {
  private readonly http = inject(HttpClient);

  submit(order: Order) {
    return this.http.post<OrderReceipt>('/api/orders', order);
  }
}
