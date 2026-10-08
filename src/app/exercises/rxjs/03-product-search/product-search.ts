import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, exhaustMap, finalize, switchMap } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <h2>Search products</h2>
    <input type="search" placeholder="Search products" [formControl]="term" />
    <ul>
      @for (product of results(); track product.id) {
        <li>
          <span>{{ product.name }}</span>
          <span>{{ product.price | currency }}</span>
          <button type="button" (click)="markDown(product)">Apply 10% off</button>
        </li>
      }
    </ul>
    @if (saving()) {
      <p>Saving…</p>
    }
    @if (lastSaved(); as saved) {
      <p role="status">Saved {{ saved.name }} at {{ saved.price | currency }}</p>
    }
  `,
})
export class ProductSearch {
  private readonly api = inject(ProductApi);
  private readonly saveRequests = new Subject<Product>();

  protected readonly term = new FormControl('', { nonNullable: true });
  protected readonly saving = signal(false);
  protected readonly lastSaved = signal<Product | undefined>(undefined);

  protected readonly results = toSignal(
    this.term.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.api.search(term)),
    ),
    { initialValue: [] as Product[] },
  );

  constructor() {
    this.saveRequests
      .pipe(
        exhaustMap((product) => {
          this.saving.set(true);
          return this.api.update(product).pipe(finalize(() => this.saving.set(false)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((saved) => this.lastSaved.set(saved));
  }

  protected markDown(product: Product) {
    this.saveRequests.next({ ...product, price: Math.round(product.price * 0.9) });
  }
}
