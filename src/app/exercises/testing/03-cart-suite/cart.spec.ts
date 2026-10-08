import { TestBed } from '@angular/core/testing';
import { CartLineRow } from './cart-line-row';
import { CART_STORAGE_KEY, CartStore } from './cart-store';

const keyboard = { id: 1, name: 'Keychron K2 Keyboard', price: 10.1 };
const mouse = { id: 4, name: 'Logitech MX Master 3S', price: 20.2 };

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    store = TestBed.inject(CartStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty', () => {
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.total()).toBe(0);
  });

  it('adds a product as a line of quantity 1', () => {
    store.add(keyboard);

    expect(store.items()).toEqual([{ productId: 1, name: keyboard.name, price: 10.1, quantity: 1 }]);
  });

  it('adding the same product again increases the quantity of its line', () => {
    store.add(keyboard);
    store.add(keyboard);

    expect(store.items()).toEqual([{ productId: 1, name: keyboard.name, price: 10.1, quantity: 2 }]);
    expect(store.count()).toBe(2);
  });

  it('totals to the cent', () => {
    store.add(keyboard);
    store.add(mouse);

    expect(store.total()).toBe(30.3);
  });

  it('removes every line of a product and leaves the others', () => {
    store.add(keyboard);
    store.add(mouse);

    store.remove(keyboard.id);

    expect(store.items().map((line) => line.productId)).toEqual([4]);
  });

  it('saves the cart 50 ms after the last change, once', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    store.add(keyboard);
    store.add(mouse);
    vi.advanceTimersByTime(49);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();

    vi.advanceTimersByTime(1);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toHaveLength(2);
  });
});

describe('CartLineRow', () => {
  it('shows the line as a parent would pass it', async () => {
    const fixture = TestBed.createComponent(CartLineRow);

    fixture.componentRef.setInput('line', { productId: 1, name: 'Keyboard', price: 10, quantity: 2 });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('Keyboard x2 - $20.00');
  });

  it('updates when the line changes', async () => {
    const fixture = TestBed.createComponent(CartLineRow);
    fixture.componentRef.setInput('line', { productId: 1, name: 'Keyboard', price: 10, quantity: 2 });
    await fixture.whenStable();

    fixture.componentRef.setInput('line', { productId: 1, name: 'Keyboard', price: 10, quantity: 3 });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('Keyboard x3 - $30.00');
  });
});
