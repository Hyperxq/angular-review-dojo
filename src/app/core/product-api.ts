import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Category, Order, OrderReceipt, Product } from './models';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Product[]>('/api/products');
  }

  get(id: number) {
    return this.http.get<Product>(`/api/products/${id}`);
  }

  search(term: string) {
    return this.http.get<Product[]>('/api/products', { params: { q: term } });
  }

  byCategory(category: string) {
    return this.http.get<Product[]>('/api/products', { params: { category } });
  }

  getCategory(id: string) {
    return this.http.get<Category>(`/api/categories/${id}`);
  }

  update(product: Product) {
    return this.http.put<Product>(`/api/products/${product.id}`, product);
  }

  stock() {
    return this.http.get<Record<number, number>>('/api/stock');
  }

  reserve(productId: number) {
    return this.http.post<{ stock: number }>(`/api/stock/${productId}/reserve`, null);
  }

  submitOrder(order: Order) {
    return this.http.post<OrderReceipt>('/api/orders', order);
  }
}
