import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class Highlight {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly color = input('#fff3a3');

  constructor() {
    this.host.nativeElement.style.backgroundColor = this.color();
  }
}
