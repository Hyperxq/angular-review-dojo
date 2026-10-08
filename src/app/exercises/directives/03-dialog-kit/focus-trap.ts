import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

@Directive({
  selector: '[appFocusTrap]',
  host: {
    '(keydown.tab)': 'wrap($event, false)',
    '(keydown.shift.tab)': 'wrap($event, true)',
  },
})
export class FocusTrap {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private focusable: HTMLElement[] = [];

  readonly enabled = input(true);

  constructor() {
    afterNextRender(() => {
      this.focusable = [...this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)];
      this.focusable[0]?.focus();
    });
  }

  protected wrap(event: Event, backwards: boolean) {
    if (!this.enabled() || this.focusable.length === 0) {
      return;
    }
    const edge = backwards ? this.focusable[0] : this.focusable[this.focusable.length - 1];
    if (document.activeElement === edge) {
      event.preventDefault();
      (backwards ? this.focusable[this.focusable.length - 1] : this.focusable[0]).focus();
    }
  }
}
