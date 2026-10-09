import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { Product } from '../../../core/models';
import { PromoBanner } from './promo-banner';

@Component({
  selector: 'app-news-feed',
  imports: [DatePipe, CurrencyPipe, PromoBanner],
  template: `
    <h2>Today's deals</h2>
    <p class="stamp">Updated {{ now | date: 'mediumTime' }}</p>
    @if (featured(); as deal) {
      <p class="featured">
        Featured: <strong>{{ deal.name }}</strong>
      </p>
    }
    <table class="deals">
      @for (deal of deals(); track deal.id) {
        <tr>
          <td>{{ deal.name }}</td>
          <td>{{ deal.price | currency }}</td>
        </tr>
      }
    </table>
    <app-promo-banner />
  `,
})
export class NewsFeed {
  private readonly products = httpResource<Product[]>(() => '/api/products');

  protected readonly now = new Date();
  protected readonly deals = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );
  protected readonly featured = computed(() => {
    const deals = this.deals();
    return deals[Math.floor(Math.random() * deals.length)];
  });
}
