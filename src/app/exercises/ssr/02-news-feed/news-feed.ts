import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, afterNextRender, computed, signal } from '@angular/core';
import { Product } from '../../../core/models';
import { PromoBanner } from './promo-banner';

@Component({
  selector: 'app-news-feed',
  imports: [DatePipe, CurrencyPipe, PromoBanner],
  template: `
    <h2>Today's deals</h2>
    @if (now(); as time) {
      <p class="stamp">Updated {{ time | date: 'mediumTime' }}</p>
    }
    @if (featured(); as deal) {
      <p class="featured">
        Featured: <strong>{{ deal.name }}</strong>
      </p>
    }
    <table class="deals">
      <tbody>
        @for (deal of deals(); track deal.id) {
          <tr>
            <td>{{ deal.name }}</td>
            <td>{{ deal.price | currency }}</td>
          </tr>
        }
      </tbody>
    </table>
    <app-promo-banner />
  `,
})
export class NewsFeed {
  private readonly products = httpResource<Product[]>(() => '/api/products');

  protected readonly now = signal<Date | null>(null);
  private readonly featuredIndex = signal(0);
  protected readonly deals = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );
  protected readonly featured = computed(() => this.deals()[this.featuredIndex()]);

  constructor() {
    afterNextRender(() => {
      this.now.set(new Date());
      this.featuredIndex.set(Math.floor(Math.random() * Math.max(this.deals().length, 1)));
    });
  }
}
