import { Directive, ElementRef, HostListener, Input, OnInit, inject } from '@angular/core';

@Directive({ selector: '[appTooltip]' })
export class Tooltip implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private tip: HTMLElement | null = null;

  @Input('appTooltip') text = '';

  ngOnInit() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hide();
      }
    });
  }

  @HostListener('mouseenter')
  show() {
    this.tip = document.createElement('div');
    this.tip.setAttribute('role', 'tooltip');
    this.tip.innerHTML = this.text;
    document.body.appendChild(this.tip);
  }

  @HostListener('mouseleave')
  hide() {
    this.tip?.remove();
    this.tip = null;
  }
}
