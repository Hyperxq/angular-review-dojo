import { TestBed } from '@angular/core/testing';
import { defer, of } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductApi } from '../../../core/product-api';
import { CatalogStats } from './catalog-stats';
import { PriceWatch } from './price-watch';
import { SelectionStore } from './selection-store';

describe('L5 - CatalogStats', () => {
  const api = { list: vi.fn(), get: vi.fn() };
  // Counts subscriptions, i.e. the HTTP requests a real cold observable would send.
  const requests = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    requests.mockReset();
    Object.values(api).forEach((fn) => fn.mockReset());
    api.list.mockReturnValue(
      defer(() => {
        requests();
        return of([...SEED_PRODUCTS]);
      }),
    );
    api.get.mockImplementation((id: number) =>
      of({ ...SEED_PRODUCTS.find((p) => p.id === id)!, price: 100 + api.get.mock.calls.length }),
    );
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
  });

  afterEach(() => vi.useRealTimers());

  it('renders the overview from a single products request', async () => {
    const fixture = TestBed.createComponent(CatalogStats);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(`Products: ${SEED_PRODUCTS.length}`);
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(SEED_PRODUCTS.length);
    expect(requests).toHaveBeenCalledTimes(1);
  });

  describe('PriceWatch', () => {
    it('shares one poll between all watchers of a product', async () => {
      const watch = TestBed.inject(PriceWatch);
      watch.price$(1).subscribe();
      watch.price$(1).subscribe();
      await vi.advanceTimersByTimeAsync(0);

      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('stops polling once nobody is watching', async () => {
      const subscription = TestBed.inject(PriceWatch).price$(1).subscribe();
      await vi.advanceTimersByTimeAsync(0);
      subscription.unsubscribe();

      await vi.advanceTimersByTimeAsync(120_000);

      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('fetches a fresh price when watched again later', async () => {
      const watch = TestBed.inject(PriceWatch);
      const first = watch.price$(1).subscribe();
      await vi.advanceTimersByTimeAsync(0);
      first.unsubscribe();
      await vi.advanceTimersByTimeAsync(3_600_000);

      const prices: number[] = [];
      watch.price$(1).subscribe((p) => prices.push(p));
      await vi.advanceTimersByTimeAsync(0);

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(prices).toEqual([102]);
    });
  });

  describe('SelectionStore', () => {
    it('gives a late subscriber the current selection', () => {
      const store = TestBed.inject(SelectionStore);
      store.select(SEED_PRODUCTS[0]);

      const seen: unknown[] = [];
      store.selected$.subscribe((p) => seen.push(p));

      expect(seen).toEqual([SEED_PRODUCTS[0]]);
    });
  });
});
