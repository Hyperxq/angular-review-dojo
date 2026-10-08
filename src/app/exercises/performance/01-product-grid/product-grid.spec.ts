import { TestBed } from '@angular/core/testing';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductGrid } from './product-grid';
import { Pricing } from './pricing';

describe('L1 - ProductGrid', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(ProductGrid);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const click = async (label: string) => {
      [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!.click();
      await fixture.whenStable();
    };
    return { fixture, root, click };
  };

  it('renders every product', async () => {
    const { root } = await setup();

    expect(root.querySelectorAll('tbody tr')).toHaveLength(SEED_PRODUCTS.length);
    expect(root.querySelectorAll('li')).toHaveLength(SEED_PRODUCTS.length);
  });

  it('keeps a typed quantity with its product when the rows are sorted', async () => {
    const { root, click } = await setup();
    const quantity = (name: string) =>
      root.querySelector<HTMLInputElement>(`input[aria-label="Quantity for ${name}"]`)!;
    quantity('Logitech MX Master 3S').value = '3';

    await click('Sort by price');

    expect(quantity('Logitech MX Master 3S').value).toBe('3');
    expect(quantity('Keychron K2 Keyboard').value).toBe('');
  });

  it('reuses the DOM nodes of the stock list when it is refreshed', async () => {
    const { root, click } = await setup();
    const before = [...root.querySelectorAll('li')];

    await click('Refresh stock');

    const after = [...root.querySelectorAll('li')];
    expect(after).toHaveLength(before.length);
    after.forEach((li, i) => expect(li).toBe(before[i]));
  });

  it('does not recalculate prices on clicks that do not change the products', async () => {
    const calls = vi.spyOn(TestBed.inject(Pricing), 'discountedPrice');
    const { click } = await setup();
    const initial = calls.mock.calls.length;

    await click('Refresh stock');
    await click('Sort by price');

    expect(calls.mock.calls.length).toBe(initial);
  });

  it('shows the clearance discount', async () => {
    const { root } = await setup();

    const row = [...root.querySelectorAll('tbody tr')].find((r) => r.textContent?.includes('Creative Pebble'))!;
    expect(row.textContent).toContain('$31.20');
  });
});
