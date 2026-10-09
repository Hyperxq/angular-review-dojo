import { Component, ElementRef, OnInit, inject } from '@angular/core';

@Component({
  selector: 'app-promo-banner',
  template: `<p class="promo">Free shipping over $50</p>`,
})
export class PromoBanner implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit() {
    this.host.nativeElement
      .querySelector('.promo')
      ?.insertAdjacentHTML('beforeend', ' <span class="badge">New</span>');
  }
}
