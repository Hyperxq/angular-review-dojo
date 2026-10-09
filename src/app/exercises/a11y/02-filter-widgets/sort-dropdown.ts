import { Component, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-sort-dropdown',
  template: `
    <div class="dropdown">
      <span class="label">{{ label() }}</span>
      <button type="button" class="trigger" (click)="open.update((o) => !o)">{{ value() }}</button>
      @if (open()) {
        <div class="menu">
          @for (option of options(); track option) {
            <div class="option" [class.selected]="option === value()" (click)="choose(option)">
              {{ option }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SortDropdown {
  readonly label = input.required<string>();
  readonly options = input.required<string[]>();
  readonly value = model.required<string>();

  protected readonly open = signal(false);

  protected choose(option: string) {
    this.value.set(option);
    this.open.set(false);
  }
}
