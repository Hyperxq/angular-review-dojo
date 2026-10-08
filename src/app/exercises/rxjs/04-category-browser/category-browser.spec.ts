import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defer, of, throwError } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductApi } from '../../../core/product-api';
import { CategoryBrowser } from './category-browser';

describe('L4 - CategoryBrowser', () => {
  const api = { byCategory: vi.fn() };
  // Counts subscriptions, i.e. the HTTP requests a real cold observable would send.
  const requests = vi.fn();
  let fixture: ComponentFixture<CategoryBrowser>;
  const el = () => fixture.nativeElement as HTMLElement;
  const names = () => [...el().querySelectorAll('li')].map((li) => li.textContent);

  async function wait(ms: number) {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    requests.mockReset();
    api.byCategory.mockReset();
    api.byCategory.mockImplementation((category: string) =>
      defer(() => {
        requests(category);
        return category === 'keyboards'
          ? throwError(() => new Error('backend down'))
          : of(SEED_PRODUCTS.filter((p) => p.category === category));
      }),
    );
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
    fixture = TestBed.createComponent(CategoryBrowser);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('does not retry a failed request immediately', async () => {
    expect(requests).toHaveBeenCalledTimes(1);

    await wait(100);
    expect(requests).toHaveBeenCalledTimes(1);

    await wait(200);
    expect(requests).toHaveBeenCalledTimes(2);
  });

  it('gives up after three retries and tells the user', async () => {
    await wait(30_000);

    expect(requests).toHaveBeenCalledTimes(4);
    expect(el().querySelector('[role=alert]')).not.toBeNull();
  });

  it('keeps working for other categories after a failure', async () => {
    await wait(30_000);

    el().querySelector<HTMLButtonElement>('[data-category=mice]')!.click();
    await wait(0);

    expect(names()).toHaveLength(3);
    expect(names()[0]).toContain('Logitech MX Master 3S');
    expect(el().querySelector('[role=alert]')).toBeNull();
  });
});
