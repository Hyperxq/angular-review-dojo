import { Injectable } from '@angular/core';

interface CachedPreview {
  host: HTMLElement;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class PreviewCache {
  private readonly cache = new Map<string, CachedPreview>();

  get size() {
    return this.cache.size;
  }

  entries() {
    return [...this.cache.entries()];
  }

  render(query: string, host: HTMLElement): string {
    const hit = this.cache.get(query);
    if (hit) {
      return hit.text;
    }
    const text = `Results for "${query}"`;
    this.cache.set(query, { host, text });
    return text;
  }

  flash(query: string) {
    this.cache.get(query)?.host.classList.add('flash');
  }
}
