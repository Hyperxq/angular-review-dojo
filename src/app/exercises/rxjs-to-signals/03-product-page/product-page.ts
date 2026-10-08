import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  template: `
    @if (product.isLoading()) {
      <p>Loading product…</p>
    }
    @if (product.error()) {
      <p role="alert">Could not load the product.</p>
    }
    @if (product.hasValue()) {
      <article>
        <h2>{{ product.value().name }}</h2>
        <p>{{ product.value().price | currency }}</p>
      </article>
    }
  `,
})
export class ProductPage {
  private readonly api = inject(ProductApi);

  readonly id = input.required({ transform: numberAttribute });

  protected readonly product = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.api.get(id),
  });
}
