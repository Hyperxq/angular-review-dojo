import { Component, effect, inject, signal } from '@angular/core';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-quick-search',
  template: `
    <h2>Quick search</h2>
    <input #box type="search" placeholder="Search products" [value]="term()" (input)="term.set(box.value)" />
    <ul>
      @for (product of results(); track product.id) {
        <li>{{ product.name }}</li>
      }
    </ul>
  `,
})
export class QuickSearch {
  private readonly api = inject(ProductApi);

  protected readonly term = signal('');
  protected readonly results = signal<Product[]>([]);

  constructor() {
    effect(() => {
      this.api.search(this.term()).subscribe((products) => this.results.set(products));
    });
  }
}
