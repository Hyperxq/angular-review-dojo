import { TestBed } from '@angular/core/testing';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { PreviewCache } from './preview-cache';
import { ProductTile } from './product-tile';
import { SearchPreview } from './search-preview';
import { TileRegistry } from './tile-registry';

describe('L2 - TileRegistry', () => {
  const tile = async (index: number) => {
    const fixture = TestBed.createComponent(ProductTile);
    fixture.componentRef.setInput('product', SEED_PRODUCTS[index]);
    await fixture.whenStable();
    return fixture;
  };

  it('knows the tiles that are on screen', async () => {
    const registry = TestBed.inject(TileRegistry);

    await tile(0);
    await tile(1);

    expect(registry.size).toBe(2);
  });

  it('highlights the tiles of a category', async () => {
    const registry = TestBed.inject(TileRegistry);
    const keyboard = await tile(0);
    const mouse = await tile(3);

    registry.highlightCategory('keyboards');
    await keyboard.whenStable();
    await mouse.whenStable();

    expect(keyboard.nativeElement.classList).toContain('highlighted');
    expect(mouse.nativeElement.classList).not.toContain('highlighted');
  });

  it('forgets a tile when it is destroyed', async () => {
    const registry = TestBed.inject(TileRegistry);

    for (let cycle = 0; cycle < 3; cycle++) {
      (await tile(0)).destroy();
      (await tile(3)).destroy();
    }

    expect(registry.size).toBe(0);
  });

  it('does not touch tiles that are gone', async () => {
    const registry = TestBed.inject(TileRegistry);
    const gone = await tile(0);
    const highlight = vi.spyOn(gone.componentInstance, 'highlight');
    gone.destroy();

    registry.highlightCategory('keyboards');

    expect(highlight).not.toHaveBeenCalled();
  });
});

describe('L2 - PreviewCache', () => {
  const preview = async (query: string) => {
    const fixture = TestBed.createComponent(SearchPreview);
    fixture.componentRef.setInput('query', query);
    await fixture.whenStable();
    fixture.destroy();
    return fixture;
  };

  it('renders the preview text', async () => {
    const fixture = TestBed.createComponent(SearchPreview);
    fixture.componentRef.setInput('query', 'mouse');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toBe('Results for "mouse"');
  });

  it('keeps the cache within its limit however many different terms are searched', async () => {
    const cache = TestBed.inject(PreviewCache);

    for (let i = 0; i < 100; i++) {
      await preview(`term ${i}`);
    }

    expect(cache.size).toBeLessThanOrEqual(20);
  });

  it('keeps text, not DOM elements', async () => {
    const cache = TestBed.inject(PreviewCache);

    await preview('keyboard');

    expect(cache.entries().map(([, value]) => typeof value)).toEqual(['string']);
  });

  it('evicts the least recently used entry first', async () => {
    const cache = TestBed.inject(PreviewCache);
    for (let i = 0; i < 20; i++) {
      await preview(`term ${i}`);
    }
    await preview('term 0');

    await preview('one more');

    const keys = cache.entries().map(([key]) => key);
    expect(keys).toContain('term 0');
    expect(keys).not.toContain('term 1');
  });
});
