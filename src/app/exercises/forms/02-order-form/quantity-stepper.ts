import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-quantity-stepper',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => QuantityStepper), multi: true },
  ],
  template: `
    <button type="button" aria-label="Decrease quantity" (click)="step(-1)" (blur)="onTouched()" [disabled]="disabled()">-</button>
    <output>{{ value() }}</output>
    <button type="button" aria-label="Increase quantity" (click)="step(1)" (blur)="onTouched()" [disabled]="disabled()">+</button>
  `,
})
export class QuantityStepper implements ControlValueAccessor {
  protected readonly value = signal(1);
  protected readonly disabled = signal(false);
  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: number) {
    this.value.set(value);
  }

  registerOnChange(fn: (value: number) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }

  protected step(delta: number) {
    this.value.update((value) => Math.max(1, value + delta));
    this.onChange(this.value());
  }
}
