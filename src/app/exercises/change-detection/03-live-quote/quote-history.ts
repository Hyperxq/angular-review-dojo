import { Component, input } from '@angular/core';

@Component({
  selector: 'app-quote-history',
  template: `
    <ol>
      @for (price of items(); track $index) {
        <li>{{ price }}</li>
      }
    </ol>
  `,
})
export class QuoteHistory {
  readonly items = input.required<number[]>();
}
