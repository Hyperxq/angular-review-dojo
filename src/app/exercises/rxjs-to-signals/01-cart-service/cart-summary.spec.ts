import { TestBed } from '@angular/core/testing';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { CartService } from './cart.service';
import { CartSummary } from './cart-summary';

const [keyboard, , , mouse] = SEED_PRODUCTS;

describe('S1 - cart service and summary', () => {
  let cart: CartService;
  let host: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<CartSummary>>;

  const lines = () => [...host.querySelectorAll('li')].map((li) => li.textContent!.replace(/\s+/g, ' ').trim());
  const count = () => host.querySelector('#count')!.textContent;
  const total = () => host.querySelector('#total')!.textContent;

  async function render() {
    await fixture.whenStable();
  }

  beforeEach(async () => {
    cart = TestBed.inject(CartService);
    fixture = TestBed.createComponent(CartSummary);
    host = fixture.nativeElement;
    await render();
  });

  it('starts empty', () => {
    expect(lines()).toEqual([]);
    expect(count()).toBe('0');
    expect(total()).toContain('$0.00');
  });

  it('lists a product once and bumps its quantity when added again', async () => {
    cart.add(keyboard);
    await render();
    expect(lines()).toEqual([`1 x ${keyboard.name} Remove`]);

    cart.add(keyboard);
    await render();
    expect(lines()).toEqual([`2 x ${keyboard.name} Remove`]);
    expect(count()).toBe('2');
    expect(total()).toContain('$178.00');
  });

  it('keeps the list, the count and the total consistent across products', async () => {
    cart.add(keyboard);
    cart.add(mouse);
    await render();

    expect(lines()).toHaveLength(2);
    expect(count()).toBe('2');
    expect(total()).toContain('$188.00');
  });

  it('applies the bulk discount from the fifth unit on', async () => {
    for (let i = 0; i < 5; i++) {
      cart.add(keyboard);
    }
    await render();

    expect(total()).toContain('$400.50');
  });

  it('removes lines and clears the cart', async () => {
    cart.add(keyboard);
    cart.add(mouse);
    await render();

    host.querySelector('button')!.click();
    await render();
    expect(lines()).toEqual([`1 x ${mouse.name} Remove`]);

    host.querySelector<HTMLButtonElement>('#clear')!.click();
    await render();
    expect(lines()).toEqual([]);
    expect(count()).toBe('0');
  });
});
