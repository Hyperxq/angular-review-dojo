import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, linkedSignal } from '@angular/core';
import { Product } from '../../../core/models';
import { variantsFor } from './variants';

@Component({
  selector: 'app-variant-picker',
  imports: [CurrencyPipe],
  template: `
    <h2>{{ product().name }}</h2>
    <div role="group" aria-label="Variant">
      @for (variant of variants(); track variant.id) {
        <button
          type="button"
          [attr.data-variant]="variant.id"
          [attr.aria-pressed]="variant.id === selected().id"
          (click)="selectedId.set(variant.id)"
        >
          {{ variant.label }}
        </button>
      }
    </div>
    <p id="price">{{ price() | currency }}</p>
  `,
})
export class VariantPicker {
  readonly product = input.required<Product>();

  private readonly productId = computed(() => this.product().id);

  protected readonly variants = computed(() => variantsFor(this.product()));
  protected readonly selectedId = linkedSignal({
    source: this.productId,
    computation: () => 'standard',
  });
  protected readonly selected = computed(
    () => this.variants().find((v) => v.id === this.selectedId()) ?? this.variants()[0],
  );
  protected readonly price = computed(() => this.product().price + this.selected().priceDelta);
}
