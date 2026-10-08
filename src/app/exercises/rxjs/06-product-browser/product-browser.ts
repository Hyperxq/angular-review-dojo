import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ProductApi } from '../../../core/product-api';
import { StockFeed } from '../../../core/stock-feed';

@Component({
  selector: 'app-product-browser',
  imports: [CurrencyPipe],
  template: `
    <h2>{{ category() }}</h2>
    <ul class="products">
      @for (product of products.value(); track product.id) {
        <li>{{ product.name }}</li>
      }
    </ul>

    <button type="button" id="compare" (click)="comparing.set(true)">Compare prices</button>
    @if (comparison.value(); as rows) {
      <table>
        @for (row of rows; track row.id) {
          <tr>
            <td>{{ row.name }}</td>
            <td>{{ row.price | currency }}</td>
          </tr>
        }
      </table>
    }

    <button type="button" id="notify" [disabled]="watching()" (click)="watchRestocks()">
      Notify me when restocked
    </button>
    @for (alert of alerts(); track $index) {
      <p role="status">{{ alert }}</p>
    }
  `,
})
export class ProductBrowser {
  private readonly api = inject(ProductApi);
  private readonly stockFeed = inject(StockFeed);
  private readonly destroyRef = inject(DestroyRef);

  readonly category = input.required<string>();

  protected readonly products = rxResource({
    params: () => this.category(),
    stream: ({ params: category }) => this.api.byCategory(category),
    defaultValue: [],
  });

  protected readonly comparing = signal(false);
  protected readonly comparison = rxResource({
    params: () => (this.comparing() ? this.category() : undefined),
    stream: ({ params: category }) =>
      this.api.byCategory(category).pipe(map((ps) => [...ps].sort((a, b) => a.price - b.price))),
  });

  protected readonly watching = signal(false);
  protected readonly alerts = signal<string[]>([]);

  protected watchRestocks() {
    this.watching.set(true);
    this.stockFeed.changes$
      .pipe(
        filter((change) => change.stock > 0),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((change) =>
        this.alerts.update((alerts) => [
          ...alerts,
          `Product #${change.productId} is back in stock (${change.stock} left)`,
        ]),
      );
  }
}
