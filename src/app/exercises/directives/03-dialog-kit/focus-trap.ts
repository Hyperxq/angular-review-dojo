import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

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

  readonly enabled = input(true);

  constructor() {
    const opener = document.activeElement as HTMLElement | null;
    inject(DestroyRef).onDestroy(() => opener?.focus());
    afterNextRender(() => this.focusable()[0]?.focus());
  }

  protected wrap(event: Event, backwards: boolean) {
    const controls = this.focusable();
    if (!this.enabled() || controls.length === 0) {
      return;
    }
    const edge = backwards ? controls[0] : controls[controls.length - 1];
    if (document.activeElement === edge) {
      event.preventDefault();
      (backwards ? controls[controls.length - 1] : controls[0]).focus();
    }
  }

  private focusable() {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)];
  }
}
