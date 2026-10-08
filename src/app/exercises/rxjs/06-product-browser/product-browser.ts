import { CurrencyPipe } from '@angular/common';
import { Component, Signal, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, filter, map } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { StockFeed } from '../../../core/stock-feed';

@Component({
  selector: 'app-product-browser',
  imports: [CurrencyPipe],
  template: `
    <h2>{{ category() }}</h2>
    <ul class="products">
      @for (product of products(); track product.id) {
        <li>{{ product.name }}</li>
      }
    </ul>

    <button type="button" id="compare" (click)="compare()">Compare prices</button>
    @if (comparison?.(); as rows) {
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
  private readonly loaded$ = new Subject<Product[]>();

  readonly category = input.required<string>();

  protected readonly products = toSignal(this.loaded$, { initialValue: [] as Product[] });
  protected comparison?: Signal<Product[] | undefined>;
  protected readonly watching = signal(false);
  protected readonly alerts = signal<string[]>([]);

  constructor() {
    effect(() => {
      this.api.byCategory(this.category()).subscribe((products) => this.loaded$.next(products));
    });
  }

  protected compare() {
    this.comparison = toSignal(
      this.api.byCategory(this.category()).pipe(map((ps) => [...ps].sort((a, b) => a.price - b.price))),
    );
  }

  protected watchRestocks() {
    this.watching.set(true);
    this.stockFeed.changes$
      .pipe(
        filter((change) => change.stock > 0),
        takeUntilDestroyed(),
      )
      .subscribe((change) =>
        this.alerts.update((alerts) => [
          ...alerts,
          `Product #${change.productId} is back in stock (${change.stock} left)`,
        ]),
      );
  }
}
