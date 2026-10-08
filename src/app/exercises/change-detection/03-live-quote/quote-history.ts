import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-quote-history',
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <ol>
      @for (price of items; track $index) {
        <li>{{ price }}</li>
      }
    </ol>
  `,
})
export class QuoteHistory {
  @Input() items: number[] = [];
}
