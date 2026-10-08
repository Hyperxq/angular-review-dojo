import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CartState } from './shop-pages';
import { SHOP_ROUTES } from './shop.routes';

describe('L1 - shop routes', () => {
  let harness: RouterTestingHarness;
  const text = () => (harness.routeNativeElement as HTMLElement).textContent ?? '';
  const url = () => TestBed.inject(Router).url;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(SHOP_ROUTES, withComponentInputBinding())],
    });
    harness = await RouterTestingHarness.create();
  });

  it('redirects the empty path to the product list', async () => {
    await harness.navigateByUrl('/');

    expect(url()).toBe('/products');
    expect(text()).toContain('Products');
  });

  it('opens a product by id', async () => {
    await harness.navigateByUrl('/products/4');

    expect(text()).toContain('Logitech MX Master 3S');
  });

  it('opens the new-product form on /products/new', async () => {
    await harness.navigateByUrl('/products/new');

    expect(text()).toContain('New product');
  });

  it('opens the account page', async () => {
    await harness.navigateByUrl('/account');

    expect(text()).toContain('Your account');
  });

  it('opens checkout when the cart has items', async () => {
    TestBed.inject(CartState).add(1);

    await harness.navigateByUrl('/checkout');

    expect(text()).toContain('Checkout');
  });

  it('sends the user to the product list when checking out with an empty cart', async () => {
    await harness.navigateByUrl('/checkout');

    expect(url()).toBe('/products');
    expect(text()).toContain('Products');
  });

  it('shows the not-found page for unknown URLs', async () => {
    await harness.navigateByUrl('/does/not/exist');

    expect(text()).toContain('Page not found');
  });
});
