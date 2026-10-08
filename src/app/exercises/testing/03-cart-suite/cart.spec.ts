import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CartLineRow } from './cart-line-row';
import { CartStore } from './cart-store';

const keyboard = { id: 1, name: 'Keychron K2 Keyboard', price: 10.1 };
const mouse = { id: 4, name: 'Logitech MX Master 3S', price: 20.2 };

const store = new CartStore();

describe('CartStore', () => {
  it('starts empty', () => {
    expect(store.items()).toEqual([]);
  });

  it('adds a product', () => {
    store.add(keyboard);

    expect(store.items().length).toBeGreaterThan(0);
  });

  it('adding the same product again increases the quantity', () => {
    store.add(keyboard);

    expect(store.count()).toBeGreaterThanOrEqual(2);
  });

  it('computes the total', () => {
    store.add(mouse);

    expect(store.total()).toBeCloseTo(40.4, 0);
  });

  it('removes a product', () => {
    store.remove(keyboard.id);

    expect(store.items().some((line) => line.productId === keyboard.id)).toBe(false);
  });

  it('saves the cart a moment after it changes', async () => {
    store.add(mouse);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(localStorage.getItem('dojo.cart')).toBeTruthy();
  });

  it('schedules a save on every change', () => {
    const persist = vi.spyOn(store as any, 'persist');

    store.add(keyboard);

    expect(persist).toHaveBeenCalled();
  });
});

describe('CartLineRow', () => {
  it('shows the line', () => {
    const fixture = TestBed.createComponent(CartLineRow);
    (fixture.componentInstance as any).line = signal({ productId: 1, name: 'Keyboard', price: 10, quantity: 2 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Keyboard x2');
  });
});
