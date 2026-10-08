import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-category-list',
  template: `
    <h3>{{ category() }}</h3>
    @if (products.isLoading()) {
      <p>Loading…</p>
    }
    @if (products.error()) {
      <p role="alert">Could not load the category.</p>
    }
    <ul>
      @if (products.hasValue()) {
        @for (item of products.value(); track item.id) {
          <li>{{ item.name }}</li>
        }
      }
    </ul>
  `,
})
export class CategoryList {
  private readonly api = inject(ProductApi);

  readonly category = input('keyboards');
  protected readonly products = rxResource({
    params: () => this.category(),
    stream: ({ params: category }) => this.api.byCategory(category),
  });
}

@Component({
  selector: 'app-featured-list',
  template: `
    <h3>Featured</h3>
    <ul>
      @if (products.hasValue()) {
        @for (item of products.value(); track item.id) {
          <li>{{ item.name }}</li>
        }
      }
    </ul>
  `,
})
export class FeaturedList {
  private readonly api = inject(ProductApi);

  protected readonly products = rxResource({ stream: () => this.api.list() });
}
