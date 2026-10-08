import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductApi } from '../../../core/product-api';
import { CartState, CartStore } from './cart-store';

const keyboard = SEED_PRODUCTS[0];
const POLL_MS = 5_000;

describe('L8 - CartStore', () => {
  const api = { stock: vi.fn(), reserve: vi.fn() };
  let hidden = false;

  const setHidden = (value: boolean) => {
    hidden = value;
    document.dispatchEvent(new Event('visibilitychange'));
  };

  function createStore() {
    const store = TestBed.inject(CartStore);
    const states: CartState[] = [];
    store.state$.subscribe((state) => states.push(state));
    return { store, states, latest: () => states[states.length - 1] };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.values(api).forEach((fn) => fn.mockReset());
    api.stock.mockImplementation(() => of({ [keyboard.id]: keyboard.stock }));
    api.reserve.mockImplementation(() => of({ stock: 0 }));
    TestBed.configureTestingModule({
      providers: [CartStore, { provide: ProductApi, useValue: api }],
    });
  });

  afterEach(() => vi.useRealTimers());

  describe('state', () => {
    it('adds products and tracks their stock', async () => {
      const { store, latest } = createStore();
      await vi.advanceTimersByTimeAsync(0);

      store.add(keyboard);
      store.add(keyboard);

      expect(latest().items).toEqual([
        { productId: keyboard.id, name: keyboard.name, price: keyboard.price, quantity: 2 },
      ]);
      expect(latest().stock[keyboard.id]).toBe(keyboard.stock - 2);
    });

    it('never mutates a state that was already emitted', () => {
      const { store, states } = createStore();

      store.add(keyboard);
      const first = states[states.length - 1];
      const snapshot = structuredClone(first);
      store.add(keyboard);
      store.remove(keyboard.id);

      expect(first).toEqual(snapshot);
      expect(new Set(states).size).toBe(states.length);
    });

    it('does not sell more than the available stock', async () => {
      api.stock.mockImplementation(() => of({ [keyboard.id]: 1 }));
      const { store, latest } = createStore();
      await vi.advanceTimersByTimeAsync(0);

      store.add(keyboard);
      store.add(keyboard);

      expect(latest().items[0].quantity).toBe(1);
    });

    it('rolls back the optimistic update when the reservation fails', async () => {
      api.reserve.mockImplementation(() => throwError(() => new Error('reserve failed')));
      const { store, latest } = createStore();
      await vi.advanceTimersByTimeAsync(0);

      store.add(keyboard);
      await vi.advanceTimersByTimeAsync(0);

      expect(latest().items).toEqual([]);
      expect(latest().stock[keyboard.id]).toBe(keyboard.stock);
    });

    it('ignores a stock snapshot that was requested before a local change', async () => {
      const first = new Subject<Record<number, number>>();
      const second = new Subject<Record<number, number>>();
      api.stock.mockReturnValueOnce(first).mockReturnValueOnce(second);
      const { store, latest } = createStore();

      await vi.advanceTimersByTimeAsync(0);
      first.next({ [keyboard.id]: 5 });
      first.complete();
      await vi.advanceTimersByTimeAsync(POLL_MS);
      store.add(keyboard);
      second.next({ [keyboard.id]: 5 });
      second.complete();

      expect(latest().stock[keyboard.id]).toBe(4);
    });
  });

  describe('stock polling', () => {
    it('polls at a fixed interval', async () => {
      createStore();

      await vi.advanceTimersByTimeAsync(POLL_MS * 3);

      expect(api.stock).toHaveBeenCalledTimes(4);
    });

    it('keeps polling after a failed request', async () => {
      api.stock
        .mockReturnValueOnce(throwError(() => new Error('poll failed')))
        .mockImplementation(() => of({ [keyboard.id]: 9 }));
      const { latest } = createStore();

      await vi.advanceTimersByTimeAsync(POLL_MS);

      expect(latest().stock[keyboard.id]).toBe(9);
    });

    it('pauses while the tab is hidden and resumes when it is visible again', async () => {
      createStore();
      await vi.advanceTimersByTimeAsync(0);
      api.stock.mockClear();

      setHidden(true);
      await vi.advanceTimersByTimeAsync(POLL_MS * 6);
      expect(api.stock).not.toHaveBeenCalled();

      setHidden(false);
      await vi.advanceTimersByTimeAsync(0);
      expect(api.stock).toHaveBeenCalledTimes(1);
    });

    it('stops polling when the store is destroyed', async () => {
      createStore();
      await vi.advanceTimersByTimeAsync(0);
      api.stock.mockClear();

      TestBed.resetTestingModule();
      await vi.advanceTimersByTimeAsync(POLL_MS * 6);

      expect(api.stock).not.toHaveBeenCalled();
    });
  });
});
