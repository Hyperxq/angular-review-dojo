import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open()) {
      <div class="backdrop">
        <div class="dialog">
          <h3>{{ title() }}</h3>
          <ng-content />
          <button type="button" (click)="open.set(false)">Cancel</button>
          <button type="button" (click)="confirm()">Delete</button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly open = model(false);
  readonly confirmed = output<void>();

  protected confirm() {
    this.confirmed.emit();
    this.open.set(false);
  }
}
