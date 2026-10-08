import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Order } from '../../../core/models';
import { OrderClient } from './order-client';
import { PlaceOrderButton } from './place-order-button';

const order: Order = { lines: [{ productId: 1, quantity: 2 }] };

describe('OrderClient', () => {
  it('posts the order and returns the receipt', () => {
    const http = { post: vi.fn().mockReturnValue(of({ orderId: 7, total: 178 })) };
    TestBed.configureTestingModule({ providers: [{ provide: HttpClient, useValue: http }] });
    const client = TestBed.inject(OrderClient);

    let receipt: unknown;
    client.submit(order).subscribe((r) => (receipt = r));

    expect(http.post).toHaveBeenCalled();
    expect(receipt).toEqual({ orderId: 7, total: 178 });
  });
});

describe('PlaceOrderButton', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  const setup = async () => {
    const fixture = TestBed.createComponent(PlaceOrderButton);
    fixture.componentRef.setInput('order', order);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  it('places the order and confirms it', async () => {
    const { fixture, el } = await setup();

    el.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    http.expectOne('/api/orders').flush({ orderId: 7, total: 178 });
    await fixture.whenStable();

    expect(el.querySelector('.msg-ok')?.textContent).toContain('Order #7');
  });

  it('hides the confirmation after three seconds', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(PlaceOrderButton);
    fixture.componentRef.setInput('order', order);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    el.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    http.expectOne('/api/orders').flush({ orderId: 7, total: 178 });
    fixture.detectChanges();
    expect(el.querySelector('.msg-ok')).not.toBeNull();

    vi.advanceTimersByTime(3000);
    fixture.detectChanges();

    expect(el.querySelector('.msg-ok')).toBeNull();
  });
});
