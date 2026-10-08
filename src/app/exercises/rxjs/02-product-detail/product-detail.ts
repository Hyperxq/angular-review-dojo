import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map, switchMap } from 'rxjs';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe],
  template: `
    @if (detail.value(); as detail) {
      <article>
        <h2>{{ detail.product.name }}</h2>
        <p>{{ detail.product.price | currency }} in {{ detail.category.name }}</p>
        <h3>Related products</h3>
        <ul>
          @for (item of detail.related; track item.id) {
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

  protected readonly detail = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) =>
      this.api.get(id).pipe(
        switchMap((product) =>
          forkJoin({
            category: this.api.getCategory(product.category),
            related: this.api.byCategory(product.category),
          }).pipe(
            map(({ category, related }) => ({
              product,
              category,
              related: related.filter((p) => p.id !== product.id),
            })),
          ),
        ),
      ),
  });
}
