import { Component, inject, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductTile } from './product-tile';
import { SearchPreview } from './search-preview';
import { TileRegistry } from './tile-registry';

@Component({
  selector: 'app-tiles-demo',
  imports: [ProductTile, SearchPreview],
  template: `
    <h2>Catalog tiles</h2>
    <button type="button" (click)="visible.update((v) => !v)">{{ visible() ? 'Hide' : 'Show' }} tiles</button>
    <button type="button" (click)="registry.highlightCategory('keyboards')">Highlight keyboards</button>
    @if (visible()) {
      @for (product of products; track product.id) {
        <app-product-tile [product]="product" />
      }
    }
    <label>Search <input (input)="query.set($any($event.target).value)" /></label>
    <app-search-preview [query]="query()" />
  `,
})
export class TilesDemo {
  protected readonly registry = inject(TileRegistry);
  protected readonly products = SEED_PRODUCTS;
  protected readonly visible = signal(true);
  protected readonly query = signal('');
}
