import { Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-price-editor',
  template: `
    <label>Price <input type="number" [value]="draft()" (input)="draft.set(+$any($event.target).value)" /></label>
    <button type="button" (click)="saved.emit(draft())">Save</button>
  `,
})
export class PriceEditor {
  readonly price = input.required<number>();
  readonly saved = output<number>();
  readonly draft = signal(0);

  constructor() {
    effect(() => {
      this.draft.set(this.price());
    });
  }
}
