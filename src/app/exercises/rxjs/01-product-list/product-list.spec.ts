import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { StockFeed } from '../../../core/stock-feed';
import { ProductList } from './product-list';

describe('L1 - ProductList', () => {
  const api = { list: vi.fn() };

  beforeEach(() => {
    api.list.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
  });

  it('renders the products as soon as the response arrives', async () => {
    const response$ = new Subject<Product[]>();
    api.list.mockReturnValue(response$);

    const fixture = TestBed.createComponent(ProductList);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Loading products');

    response$.next([...SEED_PRODUCTS]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(SEED_PRODUCTS.length);
    expect(fixture.nativeElement.textContent).not.toContain('Loading products');
  });

  it('reloads once per stock change while it is on screen', async () => {
    api.list.mockReturnValue(of([...SEED_PRODUCTS]));
    const fixture = TestBed.createComponent(ProductList);
    await fixture.whenStable();
    api.list.mockClear();

    TestBed.inject(StockFeed).changes$.next({ productId: 1, stock: 3 });

    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('stops reacting to stock changes once it has been destroyed', async () => {
    api.list.mockReturnValue(of([...SEED_PRODUCTS]));
    for (let visit = 0; visit < 3; visit++) {
      const fixture = TestBed.createComponent(ProductList);
      await fixture.whenStable();
      fixture.destroy();
    }
    api.list.mockClear();

    TestBed.inject(StockFeed).changes$.next({ productId: 1, stock: 3 });

    expect(api.list).not.toHaveBeenCalled();
  });
});
