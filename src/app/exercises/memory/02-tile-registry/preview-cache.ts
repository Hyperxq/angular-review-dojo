import { Injectable } from '@angular/core';

export const PREVIEW_CACHE_LIMIT = 20;

@Injectable({ providedIn: 'root' })
export class PreviewCache {
  private readonly cache = new Map<string, string>();

  get size() {
    return this.cache.size;
  }

  entries() {
    return [...this.cache.entries()];
  }

  render(query: string): string {
    const hit = this.cache.get(query);
    if (hit !== undefined) {
      this.cache.delete(query);
      this.cache.set(query, hit);
      return hit;
    }
    const text = `Results for "${query}"`;
    this.cache.set(query, text);
    if (this.cache.size > PREVIEW_CACHE_LIMIT) {
      this.cache.delete(this.cache.keys().next().value!);
    }
    return text;
  }
}
