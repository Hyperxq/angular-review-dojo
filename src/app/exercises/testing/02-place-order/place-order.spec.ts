import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Order } from '../../../core/models';
import { OrderClient } from './order-client';
import { PlaceOrderButton } from './place-order-button';

const order: Order = { lines: [{ productId: 1, quantity: 2 }] };

let http: HttpTestingController;

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  http = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  http.verify();
  vi.useRealTimers();
});

describe('OrderClient', () => {
  it('posts the order as JSON and returns the receipt', () => {
    let receipt: unknown;
    TestBed.inject(OrderClient)
      .submit(order)
      .subscribe((r) => (receipt = r));

    const request = http.expectOne({ method: 'POST', url: '/api/orders' });
    expect(request.request.body).toEqual(order);
    request.flush({ orderId: 7, total: 178 });

    expect(receipt).toEqual({ orderId: 7, total: 178 });
  });

  it('reports a server error without sending the order again', () => {
    const errors: unknown[] = [];
    TestBed.inject(OrderClient)
      .submit(order)
      .subscribe({ error: (e) => errors.push(e) });

    http.expectOne('/api/orders').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(errors).toHaveLength(1);
    http.expectNone('/api/orders');
  });
});

describe('PlaceOrderButton', () => {
  const create = () => {
    const fixture = TestBed.createComponent(PlaceOrderButton);
    fixture.componentRef.setInput('order', order);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const placeOrder = () =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Place order'))!;
    return { fixture, el, placeOrder };
  };

  it('disables the button while the order is being placed and confirms it afterwards', async () => {
    const { fixture, el, placeOrder } = create();

    placeOrder().click();
    fixture.detectChanges();
    expect(placeOrder().disabled).toBe(true);
    expect(el.textContent).toContain('Placing your order');

    http.expectOne('/api/orders').flush({ orderId: 7, total: 178 });
    await fixture.whenStable();

    expect(el.querySelector('[role=status]')?.textContent).toContain('Order #7 placed');
    expect(placeOrder().disabled).toBe(false);
  });

  it('tells the customer when the order could not be placed, and sends it once', async () => {
    const { fixture, el, placeOrder } = create();

    placeOrder().click();
    http.expectOne('/api/orders').flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(el.querySelector('[role=alert]')?.textContent).toContain('could not place your order');
    expect(el.querySelector('[role=status]')).toBeNull();
  });

  it('hides the confirmation after three seconds', () => {
    vi.useFakeTimers();
    const { fixture, el, placeOrder } = create();

    placeOrder().click();
    http.expectOne('/api/orders').flush({ orderId: 7, total: 178 });
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')).not.toBeNull();

    vi.advanceTimersByTime(2999);
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')).not.toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')).toBeNull();
  });
});
