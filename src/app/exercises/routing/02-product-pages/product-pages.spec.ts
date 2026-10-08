import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductApi } from '../../../core/product-api';
import { PRODUCT_PAGES_ROUTES } from './product-pages.routes';

describe('L2 - product pages', () => {
  const api = { get: vi.fn() };
  let harness: RouterTestingHarness;
  const text = () => (harness.routeNativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    api.get.mockReset();
    api.get.mockImplementation((id: number) => {
      const product = SEED_PRODUCTS.find((p) => p.id === id);
      return product ? of(product) : throwError(() => new Error('404'));
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(PRODUCT_PAGES_ROUTES, withComponentInputBinding()),
        { provide: ProductApi, useValue: api },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('shows the product from the URL', async () => {
    await harness.navigateByUrl('/products/1');

    expect(text()).toContain('Keychron K2 Keyboard');
    expect(text()).toContain('keyboards');
  });

  it('follows the URL when only the product id changes', async () => {
    await harness.navigateByUrl('/products/1');
    await harness.navigateByUrl('/products/4');

    expect(text()).toContain('Logitech MX Master 3S');
    expect(text()).not.toContain('Keychron K2 Keyboard');
  });

  it('follows the tab in the query string', async () => {
    await harness.navigateByUrl('/products/1');
    expect(text()).not.toContain('units in stock');

    await harness.navigateByUrl('/products/1?tab=stock');
    expect(text()).toContain('12 units in stock');

    await harness.navigateByUrl('/products/1');
    expect(text()).not.toContain('units in stock');
  });

  it('does not reload the product when only the tab changes', async () => {
    await harness.navigateByUrl('/products/1');
    await harness.navigateByUrl('/products/1?tab=stock');

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('redirects to the not-found page when the product does not exist', async () => {
    await harness.navigateByUrl('/products/1');
    await harness.navigateByUrl('/products/99');

    expect(TestBed.inject(Router).url).toBe('/not-found');
    expect(text()).toContain('could not find that product');
  });
});
