import { Injectable } from '@angular/core';
import type { ProductTile } from './product-tile';

@Injectable({ providedIn: 'root' })
export class TileRegistry {
  private readonly tiles = new Map<number, ProductTile>();

  get size() {
    return this.tiles.size;
  }

  /** Returns the function that removes the tile again. */
  register(tile: ProductTile) {
    const id = tile.product().id;
    this.tiles.set(id, tile);
    return () => {
      if (this.tiles.get(id) === tile) {
        this.tiles.delete(id);
      }
    };
  }

  highlightCategory(category: string) {
    for (const tile of this.tiles.values()) {
      tile.highlight(tile.product().category === category);
    }
  }
}
