import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
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
    <div #reviewsAnchor></div>
    @defer (on viewport; prefetch on idle) {
      <app-reviews-panel />
    } @placeholder {
      <div class="reviews-placeholder" style="min-height: 12rem" aria-hidden="true"></div>
    } @loading (minimum 300ms) {
      <p>Loading reviews…</p>
    } @error {
      <p role="alert">Reviews are unavailable right now.</p>
    }
  `,
})
export class ProductDetailPage {
  protected readonly product = SEED_PRODUCTS[0];
  protected readonly exportedRows = signal(0);
  private readonly reviews = viewChild<ElementRef<HTMLElement>>('reviewsAnchor');

  protected async exportCatalog() {
    const { exportToCsv } = await import('./csv-export');
    const csv = exportToCsv(SEED_PRODUCTS);
    this.exportedRows.set(csv.split('\n').length - 1);
  }

  protected jumpToReviews() {
    this.reviews()?.nativeElement.scrollIntoView?.();
  }
}
