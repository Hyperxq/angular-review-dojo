import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { Product } from '../../../core/models';
import { TileRegistry } from './tile-registry';

@Component({
  selector: 'app-product-tile',
  host: { '[class.highlighted]': 'highlighted()' },
  template: `<strong>{{ product().name }}</strong> <small>{{ product().category }}</small>`,
})
export class ProductTile implements OnInit {
  private readonly registry = inject(TileRegistry);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = input.required<Product>();
  protected readonly highlighted = signal(false);

  ngOnInit() {
    this.destroyRef.onDestroy(this.registry.register(this));
  }

  highlight(on: boolean) {
    this.highlighted.set(on);
  }
}
