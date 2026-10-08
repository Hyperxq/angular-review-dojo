import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { DraftStore } from '../draft-store';

@Component({
  selector: 'app-products-layout',
  imports: [RouterLink, RouterOutlet],
  template: `
    <h2>Edit product</h2>
    <nav>
      <a [routerLink]="['general']">General</a>
      <a [routerLink]="['pricing']">Pricing</a>
    </nav>
    <router-outlet />
  `,
})
export class ProductsLayout {}

@Component({
  selector: 'app-general-tab',
  template: `
    <label>
      Product name
      <input [value]="draft.name()" (input)="rename($event)" />
    </label>
    <button type="button" (click)="draft.save()">Save</button>
  `,
})
export class GeneralTab {
  protected readonly draft = inject(DraftStore);

  protected rename(event: Event) {
    this.draft.name.set((event.target as HTMLInputElement).value);
  }
}

@Component({
  selector: 'app-pricing-tab',
  template: `<p>Pricing for {{ draft.name() || 'a new product' }}</p>`,
})
export class PricingTab {
  protected readonly draft = inject(DraftStore);
}
