import { Component, ElementRef, Injector, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-orders-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a routerLink="/" class="nav">Orders</a>
      <a routerLink="help" class="nav">Help</a>
    </nav>
    <main #main tabindex="-1">
      <router-outlet />
    </main>
  `,
})
export class OrdersShell {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    const injector = inject(Injector);
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => afterNextRender(() => this.main().nativeElement.focus(), { injector }));
  }
}
