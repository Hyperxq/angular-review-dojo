import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FeedbackForm } from './feedback-form';
import { PageLayout } from './page-layout';
import { OrdersPage, ProductsPage } from './pages';

@Component({
  selector: 'app-pages-demo',
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [PageLayout, ProductsPage, OrdersPage, FeedbackForm],
  template: `
    <button type="button" (click)="page.set('products')">Products</button>
    <button type="button" (click)="page.set('orders')">Orders</button>
    <app-page-layout>
      @if (page() === 'products') {
        <app-products-page />
      } @else {
        <app-orders-page />
      }
      <app-feedback-form />
    </app-page-layout>
  `,
})
export class PagesDemo {
  protected readonly page = signal<'products' | 'orders'>('products');
}
