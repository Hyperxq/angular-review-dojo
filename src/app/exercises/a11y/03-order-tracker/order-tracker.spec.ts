import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { getByRole } from '../../../core/a11y-queries';
import { ORDER_ROUTES } from './orders.routes';
import { OrdersShell } from './orders-shell';

describe('L3 - order tracker', () => {
  let harness: RouterTestingHarness;
  const root = () => harness.fixture.nativeElement as HTMLElement;
  const main = () => root().querySelector('main')!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: '', component: OrdersShell, children: ORDER_ROUTES }],
          withComponentInputBinding(),
        ),
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
  });

  describe('route changes', () => {
    it('moves focus into the new content after navigating', async () => {
      await harness.navigateByUrl('/help');
      await harness.fixture.whenStable();

      expect(document.activeElement).not.toBe(document.body);
      expect(main().contains(document.activeElement)).toBe(true);
    });

    it('moves focus again on the next navigation', async () => {
      await harness.navigateByUrl('/help');
      await harness.fixture.whenStable();
      getByRole(root(), 'link', { name: 'Orders' }).focus();

      await harness.navigateByUrl('/1001');
      await harness.fixture.whenStable();

      expect(main().contains(document.activeElement)).toBe(true);
    });

    it('updates the document title for each page', async () => {
      await harness.navigateByUrl('/help');

      expect(TestBed.inject(Title).getTitle()).toBe('Help');

      await harness.navigateByUrl('/1001');
      expect(TestBed.inject(Title).getTitle()).toBe('Order 1001');
    });

    it('renders the page that was asked for', async () => {
      await harness.navigateByUrl('/1002');

      expect(getByRole(root(), 'heading', { name: 'Order #1002' })).toBeTruthy();
    });
  });

  describe('order list', () => {
    async function choose(status: string) {
      const select = root().querySelector('select')!;
      select.value = status;
      select.dispatchEvent(new Event('change'));
      await harness.fixture.whenStable();
    }

    it('announces how many orders match the filter', async () => {
      expect(getByRole(root(), 'status').textContent).toContain('4 orders shown');

      await choose('shipped');
      expect(getByRole(root(), 'status').textContent).toContain('2 orders shown');

      await choose('cancelled');
      expect(getByRole(root(), 'status').textContent).toContain('1 order shown');
    });

    it('filters the list', async () => {
      await choose('processing');

      expect(root().querySelectorAll('.orders li')).toHaveLength(1);
    });

    it('states each status in words, not only in colour', async () => {
      const rows = [...root().querySelectorAll('.orders li')];

      const spoken = rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim());
      expect(spoken[0]).toMatch(/Order #1001.*Shipped/i);
      expect(spoken[1]).toMatch(/Order #1002.*Processing/i);
      expect(spoken[2]).toMatch(/Order #1003.*Cancelled/i);
    });

    it('does not expose the decorative dot to assistive technology', async () => {
      const dots = queryAllByRole(root(), 'img');
      expect(dots).toHaveLength(0);
      expect(
        [...root().querySelectorAll('.dot')].every((d) => d.getAttribute('aria-hidden') === 'true'),
      ).toBe(true);
    });
  });
});
