import { Component, ElementRef, inject, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { CheckCounter } from './check-counter';
import { EagerCard, OnPushCard, SignalCard } from './cards';

@Component({
  selector: 'app-cd-playground',
  imports: [EagerCard, OnPushCard, SignalCard],
  template: `
    <h2>Change detection playground</h2>
    <p>Parent checked <span data-checks>0</span> times{{ counter.tick() }}</p>
    <div class="actions">
      <button type="button" (click)="mutate()">Mutate the product object</button>
      <button type="button" (click)="replace()">Replace the product object</button>
      <button type="button" (click)="nothing()">Do nothing (just an event)</button>
    </div>
    <div class="cards">
      <app-eager-card [product]="product()" />
      <app-onpush-card [product]="product()" />
      <app-signal-card [product]="product()" />
    </div>
  `,
})
export class Playground {
  protected readonly counter = new CheckCounter(inject(ElementRef));
  protected readonly product = signal<Product>({ ...SEED_PRODUCTS[0] });

  protected mutate() {
    this.product().price += 10;
  }

  protected replace() {
    this.product.update((p) => ({ ...p, price: p.price + 10 }));
  }

  protected nothing() {}
}
