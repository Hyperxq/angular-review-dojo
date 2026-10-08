import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AccountSession } from './account-data';
import { ACCOUNT_ROUTES } from './account.routes';

describe('L4 - account area', () => {
  let harness: RouterTestingHarness;
  const root = () => harness.routeNativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const url = () => TestBed.inject(Router).url;
  const click = async (selector: string, label: string) => {
    [...root().querySelectorAll<HTMLElement>(selector)].find((e) => e.textContent?.includes(label))!.click();
    await harness.fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(ACCOUNT_ROUTES, withComponentInputBinding())],
    });
    harness = await RouterTestingHarness.create();
  });

  it('lists the orders of the customer in the URL', async () => {
    await harness.navigateByUrl('/account/7');

    expect(url()).toBe('/account/7/orders');
    expect(text()).toContain('Orders for customer 7');
    expect(root().querySelectorAll('li')).toHaveLength(3);
  });

  it('does not mix up customers', async () => {
    await harness.navigateByUrl('/account/9/orders');

    expect(root().querySelectorAll('li')).toHaveLength(1);
    expect(text()).toContain('Order #4');
  });

  it('shows the order details next to the list', async () => {
    await harness.navigateByUrl('/account/7/orders/3');

    expect(text()).toContain('Dell U2723QE 27" Monitor');
  });

  it('opens an order from the list without leaving the account area', async () => {
    await harness.navigateByUrl('/account/7/orders');

    await click('a', 'Order #2');

    expect(url()).toBe('/account/7/orders/2');
    expect(text()).toContain('Glorious Model O');
  });

  it('goes back to the list from an order', async () => {
    await harness.navigateByUrl('/account/7/orders/2');

    await click('button', 'Back to orders');

    expect(url()).toBe('/account/7/orders');
  });

  it('shows the profile tab', async () => {
    await harness.navigateByUrl('/account/7/profile');

    expect(text()).toContain('Profile');
  });

  it('sends signed-out visitors to the sign-in page', async () => {
    TestBed.inject(AccountSession).signOut();

    await harness.navigateByUrl('/account/7/orders');

    expect(url()).toBe('/login');
  });

  it('keeps protecting the pages after the user signs out while on the account', async () => {
    await harness.navigateByUrl('/account/7/orders');
    TestBed.inject(AccountSession).signOut();

    await harness.navigateByUrl('/account/7/profile');

    expect(url()).toBe('/login');
  });
});
