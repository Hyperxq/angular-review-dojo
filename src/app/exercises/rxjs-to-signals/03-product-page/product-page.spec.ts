import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductApi } from '../../../core/product-api';
import { ProductPage } from './product-page';

const broken = 99;

describe('S3 - ProductPage', () => {
  const api = { get: vi.fn() };
  let harness: RouterTestingHarness;
  const text = () => (harness.routeNativeElement as HTMLElement).textContent ?? '';
  const alert = () => (harness.routeNativeElement as HTMLElement).querySelector('[role=alert]');

  beforeEach(async () => {
    api.get.mockReset();
    api.get.mockImplementation((id: number) =>
      id === broken
        ? throwError(() => new Error('not found'))
        : of(SEED_PRODUCTS.find((p) => p.id === id)!),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'products/:id', component: ProductPage }], withComponentInputBinding()),
        { provide: ProductApi, useValue: api },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('loads the product from the route', async () => {
    await harness.navigateByUrl('/products/1', ProductPage);

    expect(api.get).toHaveBeenCalledWith(1);
    expect(text()).toContain(SEED_PRODUCTS[0].name);
    expect(text()).not.toContain('Loading');
  });

  it('follows the route when only the id changes', async () => {
    await harness.navigateByUrl('/products/1', ProductPage);
    await harness.navigateByUrl('/products/4');

    expect(text()).toContain(SEED_PRODUCTS[3].name);
    expect(text()).not.toContain(SEED_PRODUCTS[0].name);
  });

  it('shows an error and stops loading when the request fails', async () => {
    await harness.navigateByUrl(`/products/${broken}`, ProductPage);

    expect(alert()?.textContent).toContain('Could not load the product');
    expect(text()).not.toContain('Loading');
  });

  it('recovers on the next id and clears the error', async () => {
    await harness.navigateByUrl(`/products/${broken}`, ProductPage);
    await harness.navigateByUrl('/products/4');

    expect(alert()).toBeNull();
    expect(text()).toContain(SEED_PRODUCTS[3].name);
    expect(text()).not.toContain('Loading');
  });
});
