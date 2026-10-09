import { Component, inject, input } from '@angular/core';
import { Analytics } from './analytics';
import { StepperState } from './stepper-state';

@Component({
  selector: 'app-quantity-stepper',
  providers: [StepperState],
  template: `
    <span class="label">{{ label() }}</span>
    <button type="button" class="dec" (click)="state.decrement()">-</button>
    <output>{{ state.count() }}</output>
    <button type="button" class="inc" (click)="state.increment()">+</button>
    <button type="button" class="reset" (click)="reset()">Reset</button>
  `,
})
export class QuantityStepper {
  private readonly analytics = inject(Analytics);
  protected readonly state = inject(StepperState);

  readonly label = input.required<string>();

  protected reset() {
    this.state.reset();
    this.analytics.track(`stepper-reset:${this.label()}`);
  }
}
