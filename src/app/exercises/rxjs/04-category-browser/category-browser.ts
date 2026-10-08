import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, of, retry, switchMap } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

interface ViewState {
  status: 'loading' | 'ready' | 'error';
  products: Product[];
}

@Component({
  selector: 'app-category-browser',
  imports: [CurrencyPipe],
  template: `
    <h2>Browse by category</h2>
    <nav>
      @for (category of categories; track category) {
        <button type="button" [attr.data-category]="category" (click)="select(category)">
          {{ category }}
        </button>
      }
    </nav>
    @if (view().status === 'error') {
      <p role="alert">We could not load the products.</p>
    }
    <ul>
      @for (product of view().products; track product.id) {
        <li>{{ product.name }} - {{ product.price | currency }}</li>
      }
    </ul>
  `,
})
export class CategoryBrowser {
  private readonly api = inject(ProductApi);
  private readonly selected$ = new BehaviorSubject('keyboards');

  protected readonly categories = ['keyboards', 'mice', 'monitors', 'audio'];

  protected readonly view = toSignal(
    this.selected$.pipe(
      switchMap((category) =>
        this.api
          .byCategory(category)
          .pipe(map((products): ViewState => ({ status: 'ready', products }))),
      ),
      retry(3),
      catchError(() => of<ViewState>({ status: 'error', products: [] })),
    ),
    { initialValue: { status: 'loading', products: [] } as ViewState },
  );

  protected select(category: string) {
    this.selected$.next(category);
  }
}
