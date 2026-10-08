import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, ReplaySubject, combineLatest, map } from 'rxjs';
import { Product } from '../../../core/models';
import { variantsFor } from './variants';

@Component({
  selector: 'app-variant-picker',
  imports: [AsyncPipe, CurrencyPipe],
  template: `
    @if (view$ | async; as view) {
      <h2>{{ view.product.name }}</h2>
      <div role="group" aria-label="Variant">
        @for (variant of view.variants; track variant.id) {
          <button
            type="button"
            [attr.data-variant]="variant.id"
            [attr.aria-pressed]="variant.id === view.selected.id"
            (click)="select(variant.id)"
          >
            {{ variant.label }}
          </button>
        }
      </div>
      <p id="price">{{ view.price | currency }}</p>
    }
  `,
})
export class VariantPicker implements OnChanges {
  @Input({ required: true }) product!: Product;

  private readonly product$ = new ReplaySubject<Product>(1);
  private readonly selectedId$ = new BehaviorSubject<string | null>(null);

  protected readonly view$ = combineLatest([this.product$, this.selectedId$]).pipe(
    map(([product, selectedId]) => {
      const variants = variantsFor(product);
      const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
      return { product, variants, selected, price: product.price + selected.priceDelta };
    }),
  );

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product']) {
      this.product$.next(this.product);
    }
  }

  protected select(variantId: string) {
    this.selectedId$.next(variantId);
  }
}
