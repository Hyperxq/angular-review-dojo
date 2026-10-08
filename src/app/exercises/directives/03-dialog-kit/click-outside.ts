import { Directive, ElementRef, effect, inject, input, output } from '@angular/core';

@Directive({ selector: '[appClickOutside]' })
export class ClickOutside {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly enabled = input(true);
  readonly clickOutside = output<MouseEvent>();

  constructor() {
    effect(() => {
      if (this.enabled()) {
        document.addEventListener('click', (event) => {
          if (!this.host.nativeElement.contains(event.target as Node)) {
            this.clickOutside.emit(event);
          }
        });
      }
    });
  }
}
