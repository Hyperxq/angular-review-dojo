import { Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { skuAvailable } from './order-validators';
import { QuantityStepper } from './quantity-stepper';
import { SkuApi } from './sku-api';

export interface OrderPayload {
  lines: { sku: string; quantity: number }[];
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, QuantityStepper],
  template: `
    <h2>New order</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div formArrayName="lines">
        @for (line of form.controls.lines.controls; track line; let i = $index) {
          <div [formGroupName]="i">
            <label>SKU <input formControlName="sku" /></label>
            @if (line.controls.sku.hasError('unavailable')) {
              <span role="alert">This SKU is not available.</span>
            }
            <app-quantity-stepper formControlName="quantity" />
            <button type="button" (click)="removeLine(i)">Remove line</button>
          </div>
        }
      </div>
      <button type="button" (click)="addLine()">Add line</button>
      <button type="submit">Place order</button>
    </form>
  `,
})
export class OrderForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly skuApi = inject(SkuApi);

  readonly submitted = output<OrderPayload>();

  readonly form = this.fb.group({ lines: this.fb.array([this.newLine()]) });

  protected addLine() {
    this.form.controls.lines.push(this.newLine());
  }

  protected removeLine(index: number) {
    this.form.controls.lines.removeAt(index);
  }

  protected submit() {
    if (this.form.invalid) {
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }

  private newLine() {
    return this.fb.group({
      sku: this.fb.control('', {
        validators: [Validators.required],
        asyncValidators: [skuAvailable(this.skuApi)],
      }),
      quantity: this.fb.control(1, [Validators.min(1), Validators.max(10)]),
    });
  }
}
