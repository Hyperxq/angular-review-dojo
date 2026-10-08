import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

const MIN_LENGTH = 2;

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

  protected readonly results = toSignal(
    toObservable(this.term).pipe(
      debounceTime(300),
      map((term) => term.trim()),
      distinctUntilChanged(),
      switchMap((term) => (term.length < MIN_LENGTH ? of<Product[]>([]) : this.api.search(term))),
    ),
    { initialValue: [] as Product[] },
  );
}
