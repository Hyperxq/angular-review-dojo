import { Injectable } from '@angular/core';
import type { ProductTile } from './product-tile';

@Injectable({ providedIn: 'root' })
export class TileRegistry {
  private readonly tiles = new Map<number, ProductTile>();

  get size() {
    return this.tiles.size;
  }

  register(tile: ProductTile) {
    this.tiles.set(tile.product().id, tile);
  }

  highlightCategory(category: string) {
    for (const tile of this.tiles.values()) {
      tile.highlight(tile.product().category === category);
    }
  }
}
