import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Order } from '../../../core/models';
import { OrderClient } from './order-client';

/** Independent check of what the payments team requires. */
describe('audit - placing an order', () => {
  const order: Order = { lines: [{ productId: 1, quantity: 2 }] };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('sends the order exactly once, even when the server answers with an error', () => {
    const http = TestBed.inject(HttpTestingController);
    const errors: unknown[] = [];

    TestBed.inject(OrderClient)
      .submit(order)
      .subscribe({ error: (e) => errors.push(e) });
    http.expectOne({ method: 'POST', url: '/api/orders' }).flush('boom', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(errors).toHaveLength(1);
    http.verify();
  });
});
