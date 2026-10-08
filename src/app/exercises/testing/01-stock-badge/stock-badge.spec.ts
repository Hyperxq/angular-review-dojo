import { TestBed } from '@angular/core/testing';
import { StockFeed } from '../../../core/stock-feed';
import { LowStockStore } from './low-stock.store';
import { StockBadge } from './stock-badge';

describe('StockBadge', () => {
  const render = async (stock: number) => {
    const fixture = TestBed.createComponent(StockBadge);
    fixture.componentRef.setInput('stock', stock);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it.each([
    [0, 'Out of stock'],
    [1, 'Low stock'],
    [5, 'Low stock'],
    [6, 'In stock'],
    [40, 'In stock'],
  ])('shows the right label for %i units', async (stock, label) => {
    expect((await render(stock)).textContent?.trim()).toBe(label);
  });

  it('highlights low stock only', async () => {
    expect((await render(3)).querySelector('.badge-warn')).not.toBeNull();
    expect((await render(30)).querySelector('.badge-warn')).toBeNull();
  });

  it('follows the stock input when it changes', async () => {
    const fixture = TestBed.createComponent(StockBadge);
    fixture.componentRef.setInput('stock', 30);
    await fixture.whenStable();

    fixture.componentRef.setInput('stock', 0);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('Out of stock');
  });
});

describe('LowStockStore', () => {
  const collect = () => {
    const emissions: number[][] = [];
    TestBed.inject(LowStockStore).lowStock$.subscribe((ids) => emissions.push(ids));
    return { emissions, push: TestBed.inject(StockFeed).changes$ };
  };

  it('emits nothing until the feed says something', () => {
    const { emissions } = collect();

    expect(emissions).toEqual([]);
  });

  it('collects the products that run low, in order, including the threshold itself', () => {
    const { emissions, push } = collect();

    push.next({ productId: 6, stock: 5 });
    push.next({ productId: 9, stock: 0 });

    expect(emissions).toEqual([[6], [6, 9]]);
  });

  it('does not list a product twice', () => {
    const { emissions, push } = collect();

    push.next({ productId: 6, stock: 4 });
    push.next({ productId: 6, stock: 3 });

    expect(emissions.at(-1)).toEqual([6]);
  });

  it('ignores well-stocked products', () => {
    const { emissions, push } = collect();

    push.next({ productId: 1, stock: 12 });

    expect(emissions).toEqual([[]]);
  });

  it('takes a product off the list once it is restocked', () => {
    const { emissions, push } = collect();

    push.next({ productId: 6, stock: 2 });
    push.next({ productId: 6, stock: 20 });

    expect(emissions.at(-1)).toEqual([]);
  });
});
