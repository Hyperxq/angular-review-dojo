import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Order, OrderReceipt, Product } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class OrdersClient {
  private readonly http = inject(HttpClient);

  catalog() {
    return this.http.get<Product[]>('/api/products');
  }

  place(order: Order) {
    return this.http.post<OrderReceipt>('/api/orders', order);
  }
}
