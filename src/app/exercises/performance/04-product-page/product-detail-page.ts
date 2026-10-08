import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { exportToCsv } from './csv-export';
import { ReviewsPanel } from './reviews-panel';

@Component({
  selector: 'app-product-detail-page',
  imports: [ReviewsPanel],
  template: `
    <h2>{{ product.name }}</h2>
    <p>{{ product.price }} USD</p>
    <button type="button" (click)="exportCatalog()">Export catalog (CSV)</button>
    <button type="button" (click)="jumpToReviews()">Jump to reviews</button>
    @if (exportedRows() > 0) {
      <p role="status">Exported {{ exportedRows() }} products</p>
    }
    <app-reviews-panel />
  `,
})
export class ProductDetailPage {
  protected readonly product = SEED_PRODUCTS[0];
  protected readonly exportedRows = signal(0);
  private readonly reviews = viewChild(ReviewsPanel, { read: ElementRef });

  protected exportCatalog() {
    const csv = exportToCsv(SEED_PRODUCTS);
    this.exportedRows.set(csv.split('\n').length - 1);
  }

  protected jumpToReviews() {
    this.reviews()?.nativeElement.scrollIntoView?.();
  }
}
