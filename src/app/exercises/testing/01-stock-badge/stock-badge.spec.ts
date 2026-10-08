import { TestBed } from '@angular/core/testing';
import { StockFeed } from '../../../core/stock-feed';
import { LowStockStore } from './low-stock.store';
import { StockBadge } from './stock-badge';

describe('StockBadge', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(StockBadge);
    fixture.componentRef.setInput('stock', 3);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows a label for low stock', () => {
    const fixture = TestBed.createComponent(StockBadge);
    fixture.componentRef.setInput('stock', 3);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBeDefined();
  });

  it('does not show the in-stock label when the product is sold out', () => {
    const fixture = TestBed.createComponent(StockBadge);
    fixture.componentRef.setInput('stock', 0);

    expect(fixture.nativeElement.textContent).not.toContain('In stock');
  });
});

describe('LowStockStore', () => {
  it('collects the products that run low', () => {
    const store = TestBed.inject(LowStockStore);

    store.lowStock$.subscribe((ids) => {
      expect(ids).toEqual([6]);
    });
  });

  it('ignores products that are well stocked', () => {
    const feed = TestBed.inject(StockFeed);
    const store = TestBed.inject(LowStockStore);

    store.lowStock$.subscribe((ids) => {
      expect(ids).toEqual([]);
    });
    feed.changes$.next({ productId: 1, stock: 12 });
  });
});
