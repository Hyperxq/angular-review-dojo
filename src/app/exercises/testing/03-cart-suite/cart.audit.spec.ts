import { TestBed } from '@angular/core/testing';
import { CartStore } from './cart-store';

/** Independent check of the cart rules, with a fresh store per test. */
describe('audit - cart', () => {
  const keyboard = { id: 1, name: 'Keychron K2 Keyboard', price: 10.1 };
  const mouse = { id: 4, name: 'Logitech MX Master 3S', price: 20.2 };

  it('keeps one line per product and counts its quantity', () => {
    const store = TestBed.inject(CartStore);

    store.add(keyboard);
    store.add(keyboard);

    expect(store.items()).toEqual([{ productId: 1, name: keyboard.name, price: 10.1, quantity: 2 }]);
    expect(store.count()).toBe(2);
  });

  it('totals to the cent', () => {
    const store = TestBed.inject(CartStore);

    store.add(keyboard);
    store.add(mouse);

    expect(store.total()).toBe(30.3);
  });
});
