import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getByRole, queryAllByRole } from '../../../core/a11y-queries';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { provideAppErrors } from './app-error-handler';
import { CatalogPage } from './catalog-page';
import { ErrorReporter } from './error-reporter';

describe('L1 - catalog page', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppErrors()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  async function open() {
    const fixture = TestBed.createComponent(CatalogPage);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  const fail = () =>
    http
      .expectOne('/api/products')
      .flush('down', { status: 503, statusText: 'Service Unavailable' });

  it('lists the products', async () => {
    const { fixture, root } = await open();

    http.expectOne('/api/products').flush(SEED_PRODUCTS.slice(0, 2));
    await fixture.whenStable();

    expect(root.querySelectorAll('.products li')).toHaveLength(2);
    expect(root.textContent).not.toContain('No products found.');
  });

  it('says "No products found." only for a real empty answer', async () => {
    const { fixture, root } = await open();

    http.expectOne('/api/products').flush([]);
    await fixture.whenStable();

    expect(root.querySelector('.empty')?.textContent).toContain('No products found.');
    expect(queryAllByRole(root, 'alert')).toHaveLength(0);
  });

  it('tells the user when loading failed', async () => {
    const { fixture, root } = await open();

    fail();
    await fixture.whenStable();

    expect(getByRole(root, 'alert').textContent).toContain('could not load');
    expect(root.textContent).not.toContain('No products found.');
  });

  it('lets the user try again', async () => {
    const { fixture, root } = await open();
    fail();
    await fixture.whenStable();

    getByRole(root, 'button', { name: 'Try again' }).click();
    fixture.detectChanges();
    http.expectOne('/api/products').flush(SEED_PRODUCTS.slice(0, 3));
    await fixture.whenStable();

    expect(root.querySelectorAll('.products li')).toHaveLength(3);
    expect(queryAllByRole(root, 'alert')).toHaveLength(0);
  });

  describe('global error handler', () => {
    it('forwards unexpected errors to the reporting service', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const error = new Error('boom');

      TestBed.inject(ErrorHandler).handleError(error);

      expect(TestBed.inject(ErrorReporter).reports).toEqual([error]);
    });

    it('still writes to the console', () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      TestBed.inject(ErrorHandler).handleError(new Error('boom'));

      expect(log).toHaveBeenCalledOnce();
    });
  });
});
