import { TestScheduler } from 'rxjs/testing';
import { Observable } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { OrderReceipt } from '../../../core/models';
import { OrderLineDraft, lineTotal$, placeOrder$ } from './order-streams';
import { withPrevious } from './with-previous';

describe('L7 - order streams', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  const mouse = SEED_PRODUCTS[3];
  const draft = (price: number, quantity: number): OrderLineDraft => ({
    product: { ...mouse, price },
    quantity,
  });

  describe('lineTotal$', () => {
    it('emits one total per change of the line', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const line$ = hot<OrderLineDraft>('--a--b--|', { a: draft(10, 1), b: draft(20, 2) });

        expectObservable(lineTotal$(line$)).toBe('--x--y--|', { x: 10, y: 40 });
      });
    });
  });

  describe('placeOrder$', () => {
    const receipt: OrderReceipt = { orderId: 1, total: 20 };

    it('submits only when the button is clicked, using the latest line', () => {
      scheduler.run(({ hot, cold, expectObservable }) => {
        const click$ = hot<void>('----c----------');
        const line$ = hot<OrderLineDraft>('a--b-----d----', {
          a: draft(10, 1),
          b: draft(10, 2),
          d: draft(10, 3),
        });
        const submit = vi.fn(() => cold<OrderReceipt>('-r|', { r: receipt }));

        expectObservable(placeOrder$(click$ as Observable<void>, line$, submit)).toBe(
          '-----r---------',
          { r: receipt },
        );
        scheduler.flush();

        expect(submit).toHaveBeenCalledTimes(1);
        expect(submit).toHaveBeenCalledWith({ lines: [{ productId: mouse.id, quantity: 2 }] });
      });
    });
  });

  describe('withPrevious', () => {
    it('pairs every value with the one before it and completes with the source', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const source = cold('--a--b--c--|');

        expectObservable(source.pipe(withPrevious())).toBe('--x--y--z--|', {
          x: [undefined, 'a'],
          y: ['a', 'b'],
          z: ['b', 'c'],
        });
      });
    });

    it('propagates errors', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const source = cold('--a--#', undefined, new Error('boom'));

        expectObservable(source.pipe(withPrevious())).toBe(
          '--x--#',
          { x: [undefined, 'a'] },
          new Error('boom'),
        );
      });
    });

    it('unsubscribes from the source when the consumer unsubscribes', () => {
      scheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const source = cold('-a-b-c-d-|');
        const unsubscribe = '---!';

        expectObservable(source.pipe(withPrevious()), unsubscribe).toBe('-x', {
          x: [undefined, 'a'],
        });
        expectSubscriptions(source.subscriptions).toBe('^--!');
      });
    });
  });
});
