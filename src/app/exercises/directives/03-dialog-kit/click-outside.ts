import { Directive, ElementRef, inject, input, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ClickOutside {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly enabled = input(true);
  readonly clickOutside = output<MouseEvent>();

  protected onDocumentClick(event: MouseEvent) {
    if (this.enabled() && !this.host.nativeElement.contains(event.target as Node)) {
      this.clickOutside.emit(event);
    }
  }
}
