import { Component, computed, input, model, signal } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-sort-dropdown',
  template: `
    <div class="dropdown">
      <span class="label" [id]="id + '-label'">{{ label() }}</span>
      <button
        type="button"
        class="trigger"
        [id]="id + '-trigger'"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? id + '-list' : null"
        [attr.aria-labelledby]="id + '-label ' + id + '-trigger'"
        [attr.aria-activedescendant]="open() ? optionId(active()) : null"
        (click)="open() ? close() : openMenu()"
        (keydown)="onKeydown($event)"
      >
        {{ value() }}
      </button>
      @if (open()) {
        <div class="menu" role="listbox" [id]="id + '-list'" [attr.aria-labelledby]="id + '-label'">
          @for (option of options(); track option; let i = $index) {
            <div
              class="option"
              role="option"
              [id]="optionId(i)"
              [attr.aria-selected]="option === value()"
              [class.active]="i === active()"
              (click)="choose(option)"
            >
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

  protected readonly id = `sort-dropdown-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly active = signal(0);
  private readonly last = computed(() => this.options().length - 1);

  protected optionId(index: number) {
    return `${this.id}-option-${index}`;
  }

  protected openMenu() {
    this.active.set(Math.max(this.options().indexOf(this.value()), 0));
    this.open.set(true);
  }

  protected close() {
    this.open.set(false);
  }

  protected choose(option: string) {
    this.value.set(option);
    this.close();
  }

  protected onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openMenu();
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.active.update((i) => Math.min(Math.max(i + step, 0), this.last()));
        return;
      }
      case 'Enter':
      case ' ':
        if (this.open()) {
          event.preventDefault();
          this.choose(this.options()[this.active()]);
        }
        return;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        return;
    }
  }
}
