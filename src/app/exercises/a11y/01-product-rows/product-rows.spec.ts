import { TestBed } from '@angular/core/testing';
import { getByRole } from '../../../core/a11y-queries';
import { ProductRows } from './product-rows';

describe('L1 - product rows', () => {
  async function render() {
    const fixture = TestBed.createComponent(ProductRows);
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('filters the rows while typing', async () => {
    const { fixture, root } = await render();
    const search = root.querySelector<HTMLInputElement>('input[type=search]')!;

    search.value = 'logitech';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(root.querySelectorAll('.row')).toHaveLength(1);
  });

  it('lets the keyboard select a product: the name is a button', async () => {
    const { fixture, root } = await render();

    getByRole(root, 'button', { name: /^Keychron K2 Keyboard/ }).click();
    await fixture.whenStable();

    expect(root.querySelector('.selected')?.textContent).toContain('Keychron K2 Keyboard');
  });

  it('names the icon buttons after the product they act on', async () => {
    const { fixture, root } = await render();

    getByRole(root, 'button', { name: 'Remove Keychron K2 Keyboard' }).click();
    await fixture.whenStable();

    expect(root.textContent).not.toContain('Keychron K2 Keyboard');
  });

  it('says what the wishlist button does and what state it is in', async () => {
    const { fixture, root } = await render();
    const add = getByRole(root, 'button', { name: 'Add Keychron K2 Keyboard to wishlist' });

    add.click();
    await fixture.whenStable();

    expect(
      getByRole(root, 'button', { name: 'Remove Keychron K2 Keyboard from wishlist' }),
    ).toBeTruthy();
  });

  it('labels the search box', async () => {
    const { root } = await render();

    expect(getByRole(root, 'searchbox', { name: 'Search products' })).toBeTruthy();
  });

  it('labels every quantity box with its product', async () => {
    const { root } = await render();

    expect(
      getByRole(root, 'spinbutton', { name: 'Quantity for Keychron K2 Keyboard' }),
    ).toBeTruthy();
    expect(
      getByRole(root, 'spinbutton', { name: 'Quantity for Logitech MX Master 3S' }),
    ).toBeTruthy();
  });

  it('never removes the keyboard focus indicator', async () => {
    await render();

    const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    expect(css).not.toMatch(/outline:\s*(none|0)\b/);
  });
});
