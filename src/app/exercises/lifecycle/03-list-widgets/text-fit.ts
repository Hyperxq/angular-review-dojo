import { Component, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-text-fit',
  template: `<span class="label">{{ label() }}</span> <small data-testid="width">{{ width() }}px</small>`,
})
export class TextFit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  protected readonly width = signal(0);

  constructor() {
    afterNextRender(() => {
      this.width.set(this.host.nativeElement.querySelector<HTMLElement>('.label')!.offsetWidth);
    });
  }
}
