import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Order, OrderReceipt } from '../../../core/models';
import { API_BASE_URL } from './api-client';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  place(order: Order) {
    return this.http.post<OrderReceipt>(`${this.base}/orders`, order);
  }

  trackView(page: string) {
    return this.http.post('https://analytics.thirdparty.example/collect', { page });
  }
}
