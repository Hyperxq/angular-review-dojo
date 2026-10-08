import { ElementRef } from '@angular/core';

/**
 * Counts how many times a component's template was evaluated.
 *
 * Calling `tick()` from the template is intentional here: it is the only way to observe a view
 * refresh from the outside. In dev mode Angular evaluates every template twice per refresh (the second
 * pass is the ExpressionChanged check), so evaluations in the same synchronous run count once, and the
 * number is written straight into the DOM: binding it would change the value between the two passes.
 */
export class CheckCounter {
  private count = 0;
  private scheduled = false;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  tick(): string {
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => {
        this.scheduled = false;
        this.count++;
        const target = this.host.nativeElement.querySelector('[data-checks]');
        if (target) {
          target.textContent = String(this.count);
        }
      });
    }
    return '';
  }
}
