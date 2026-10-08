import { Component, signal } from '@angular/core';
import { Highlight } from './highlight';
import { Tooltip } from './tooltip';

@Component({
  selector: 'app-product-actions',
  imports: [Tooltip, Highlight],
  template: `
    <h2>Product actions</h2>
    <button type="button" appTooltip="Save <b>all</b> changes" appHighlight [color]="color()">Save</button>
    <button type="button" appTooltip="Remove this product from the catalog">Delete</button>
    <button type="button" (click)="toggleColor()">Toggle highlight colour</button>
  `,
})
export class ProductActions {
  protected readonly color = signal('#fff3a3');

  protected toggleColor() {
    this.color.update((c) => (c === '#fff3a3' ? '#b8f5c0' : '#fff3a3'));
  }
}
