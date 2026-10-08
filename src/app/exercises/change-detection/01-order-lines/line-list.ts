import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { OrderLine } from './order-line';

@Component({
  selector: 'app-line-list',
  template: `
    <ul>
      @for (line of lines; track line.productId) {
        <li>
          <span class="name">{{ line.name }}</span>
          <button type="button" aria-label="Decrease" (click)="change(line, -1)">-</button>
          <span class="qty">{{ line.quantity }}</span>
          <button type="button" aria-label="Increase" (click)="change(line, 1)">+</button>
          <button type="button" aria-label="Remove" (click)="removed.emit($index)">Remove</button>
        </li>
      } @empty {
        <li>No lines yet</li>
      }
    </ul>
  `,
})
export class LineList {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) lines: OrderLine[] = [];
  @Output() removed = new EventEmitter<number>();

  protected change(line: OrderLine, delta: number) {
    line.quantity = Math.max(1, line.quantity + delta);
    this.cdr.detectChanges();
  }
}
