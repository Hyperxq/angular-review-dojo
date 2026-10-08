import { DestroyRef, Directive, inject, input } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(document:keydown.escape)': 'hide()',
  },
})
export class Tooltip {
  private tip: HTMLElement | null = null;

  readonly text = input('', { alias: 'appTooltip' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  protected show() {
    this.hide();
    this.tip = document.createElement('div');
    this.tip.setAttribute('role', 'tooltip');
    this.tip.textContent = this.text();
    document.body.appendChild(this.tip);
  }

  protected hide() {
    this.tip?.remove();
    this.tip = null;
  }
}
