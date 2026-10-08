import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { BaseListComponent } from './base-list';

@Component({
  selector: 'app-category-list',
  template: `
    <h3>{{ category }}</h3>
    @if (loading()) {
      <p>Loading…</p>
    }
    @if (failed()) {
      <p role="alert">Could not load the category.</p>
    }
    <ul>
      @for (item of items(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  `,
})
export class CategoryList extends BaseListComponent<Product> implements OnInit {
  private readonly api = inject(ProductApi);

  @Input() category = 'keyboards';

  protected load() {
    return this.api.byCategory(this.category);
  }

  override ngOnInit() {
    console.debug('CategoryList init', this.category);
  }
}

@Component({
  selector: 'app-featured-list',
  template: `
    <h3>Featured</h3>
    <ul>
      @for (item of items(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  `,
})
export class FeaturedList extends BaseListComponent<Product> implements OnDestroy {
  private readonly api = inject(ProductApi);

  protected load() {
    return this.api.list();
  }

  override ngOnDestroy() {
    console.debug('FeaturedList destroyed');
  }
}
