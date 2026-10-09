import { Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { NewAlert } from './alert.models';

@Component({
  selector: 'app-alert-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>
        Product
        <select formControlName="productId">
          @for (product of products; track product.id) {
            <option [value]="product.id">{{ product.name }}</option>
          }
        </select>
      </label>
      <label>
        Target price
        <input type="number" formControlName="targetPrice" />
      </label>
      @if (form.controls.targetPrice.touched && form.controls.targetPrice.invalid) {
        <div class="error">Enter a target price.</div>
      }
      <label>
        Note
        <input type="text" formControlName="note" />
      </label>
      <button type="submit">Create alert</button>
    </form>
  `,
})
export class AlertForm {
  protected readonly products = SEED_PRODUCTS;
  protected readonly form = inject(NonNullableFormBuilder).group({
    productId: [SEED_PRODUCTS[0].id],
    targetPrice: [0, [Validators.required]],
    note: [''],
  });

  readonly created = output<NewAlert>();

  protected submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { productId, targetPrice, note } = this.form.getRawValue();
    const product = SEED_PRODUCTS.find((p) => p.id === Number(productId))!;
    this.created.emit({ productId: product.id, productName: product.name, targetPrice, note });
    this.form.reset();
  }
}
