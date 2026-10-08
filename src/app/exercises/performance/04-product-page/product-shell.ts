import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SHELL_LINKS } from './shell-links';

@Component({
  selector: 'app-product-page-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      @for (link of links; track link.path) {
        <a [routerLink]="[link.path]">{{ link.label }}</a>
      }
    </nav>
    <router-outlet />
  `,
})
export class ProductPageShell {
  protected readonly links = SHELL_LINKS;
}
