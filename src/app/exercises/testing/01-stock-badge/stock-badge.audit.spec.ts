import { TestBed } from '@angular/core/testing';
import { StockFeed } from '../../../core/stock-feed';
import { LowStockStore } from './low-stock.store';
import { StockBadge } from './stock-badge';

/** Independent check of the behaviour the product team asked for. */
describe('audit - stock badge and low-stock list', () => {
  const labelFor = async (stock: number) => {
    const fixture = TestBed.createComponent(StockBadge);
    fixture.componentRef.setInput('stock', stock);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent?.trim();
  };

  it('labels a sold-out product as out of stock', async () => {
    expect(await labelFor(0)).toBe('Out of stock');
  });

  it('labels 1 to 5 units as low stock and 6 or more as in stock', async () => {
    expect(await labelFor(1)).toBe('Low stock');
    expect(await labelFor(5)).toBe('Low stock');
    expect(await labelFor(6)).toBe('In stock');
  });

  it('lists a product that is down to exactly 5 units', () => {
    const lists: number[][] = [];
    TestBed.inject(LowStockStore).lowStock$.subscribe((ids) => lists.push(ids));

    TestBed.inject(StockFeed).changes$.next({ productId: 6, stock: 5 });

    expect(lists.at(-1)).toEqual([6]);
  });

  it('takes a product off the list once it is restocked', () => {
    const lists: number[][] = [];
    TestBed.inject(LowStockStore).lowStock$.subscribe((ids) => lists.push(ids));
    const feed = TestBed.inject(StockFeed);

    feed.changes$.next({ productId: 6, stock: 2 });
    feed.changes$.next({ productId: 9, stock: 1 });
    feed.changes$.next({ productId: 6, stock: 20 });

    expect(lists.at(-1)).toEqual([9]);
  });
});
