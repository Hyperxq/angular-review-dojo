import { TestBed } from '@angular/core/testing';
import { getByRole } from '../../../core/a11y-queries';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { CartWidgetsDemo } from './cart-widgets';
import { CartState } from './cart-state';

describe('L1 - cart widgets', () => {
  async function render() {
    const fixture = TestBed.createComponent(CartWidgetsDemo);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const click = async (name: string) => {
      getByRole(root, 'button', { name }).click();
      await fixture.whenStable();
    };
    return { root, click };
  }

  it('shows the number of units in the cart badge as products are added', async () => {
    const { root, click } = await render();
    expect(root.querySelector('.badge')?.textContent).toContain('Cart (0)');

    await click('Add Keychron K2 Keyboard');
    await click('Add Keychron K2 Keyboard');
    await click('Add Ducky One 3 Keyboard');

    expect(root.querySelector('.badge')?.textContent).toContain('Cart (3)');
  });

  it('keeps the total in step when a product is removed', async () => {
    const { root, click } = await render();
    await click('Add Keychron K2 Keyboard');
    await click('Add Ducky One 3 Keyboard');
    expect(root.querySelector('.total')?.textContent).toContain('$208.00');

    await click('Remove Keychron K2 Keyboard');

    expect(root.querySelector('.total')?.textContent).toContain('$119.00');
    expect(root.querySelector('.badge')?.textContent).toContain('Cart (1)');
  });

  it('lists the quantity of each product', async () => {
    const { root, click } = await render();

    await click('Add Keychron K2 Keyboard');
    await click('Add Keychron K2 Keyboard');

    expect(root.querySelector('.lines')?.textContent).toContain('2 x Keychron K2 Keyboard');
  });

  it('can only be changed through the service methods', () => {
    const cart = TestBed.inject(CartState);

    for (const signal of [cart.items, cart.total, cart.count]) {
      expect('set' in signal).toBe(false);
      expect('update' in signal).toBe(false);
    }
  });

  it('derives total and count from the items it holds', () => {
    const cart = TestBed.inject(CartState);
    const [keyboard, mouse] = SEED_PRODUCTS;

    cart.add(keyboard);
    cart.add(keyboard);
    cart.add(mouse);
    cart.remove(keyboard.id);

    expect(cart.count()).toBe(1);
    expect(cart.total()).toBe(mouse.price);
  });
});
