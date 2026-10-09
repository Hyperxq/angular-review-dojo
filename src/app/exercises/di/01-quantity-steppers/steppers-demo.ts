import { Component } from '@angular/core';
import { QuantityStepper } from './quantity-stepper';

@Component({
  selector: 'app-steppers-demo',
  imports: [QuantityStepper],
  template: `
    <ul>
      <li><app-quantity-stepper label="Keychron K2 Keyboard" /></li>
      <li><app-quantity-stepper label="Ducky One 3 Keyboard" /></li>
    </ul>
  `,
})
export class SteppersDemo {}
