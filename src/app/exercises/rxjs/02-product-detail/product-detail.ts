import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { Category, Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe],
  template: `
    @if (product(); as product) {
      <article>
        <h2>{{ product.name }}</h2>
        <p>{{ product.price | currency }} in {{ category()?.name }}</p>
        <h3>Related products</h3>
        <ul>
          @for (item of related(); track item.id) {
            <li>{{ item.name }}</li>
          }
        </ul>
      </article>
    }
  `,
})
export class ProductDetail {
  private readonly api = inject(ProductApi);

  readonly id = input.required({ transform: numberAttribute });

  protected readonly product = signal<Product | undefined>(undefined);
  protected readonly category = signal<Category | undefined>(undefined);
  protected readonly related = signal<Product[]>([]);

  constructor() {
    effect(() => {
      const id = this.id();
      this.api.get(id).subscribe((product) => {
        this.product.set(product);
        this.api.getCategory(product.category).subscribe((category) => {
          this.category.set(category);
          this.api.byCategory(category.id).subscribe((products) => {
            this.related.set(products.filter((p) => p.id !== product.id));
          });
        });
      });
    });
  }
}
