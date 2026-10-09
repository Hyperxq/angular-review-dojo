import { Component, inject, input } from '@angular/core';
import { Analytics } from './analytics';
import { StepperState } from './stepper-state';

@Component({
  selector: 'app-quantity-stepper',
  template: `
    <span class="label">{{ label() }}</span>
    <button type="button" class="dec" (click)="state.decrement()">-</button>
    <output>{{ state.count() }}</output>
    <button type="button" class="inc" (click)="state.increment()">+</button>
    <button type="button" class="reset" (click)="reset()">Reset</button>
  `,
})
export class QuantityStepper {
  protected readonly state = inject(StepperState);

  readonly label = input.required<string>();

  protected reset() {
    inject(Analytics).track(`stepper-reset:${this.label()}`);
    this.state.reset();
  }
}
