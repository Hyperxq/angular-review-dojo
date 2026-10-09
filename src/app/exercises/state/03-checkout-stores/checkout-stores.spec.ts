import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CartStore } from './cart-store';
import { Session } from './session';
import { StockStore } from './stock-store';

describe('L3 - checkout stores', () => {
  let http: HttpTestingController;
  let cart: InstanceType<typeof CartStore>;
  let stock: InstanceType<typeof StockStore>;
  let session: Session;

  const reservations = (id: number) => http.match(`/api/stock/${id}/reserve`);
  const soldOut = { status: 409, statusText: 'Conflict' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartStore);
    stock = TestBed.inject(StockStore);
    session = TestBed.inject(Session);
    stock.load();
    http.expectOne('/api/stock').flush({ 1: 5, 2: 5, 3: 5 });
    session.login('ana');
  });

  it('updates the stock and the cart before the server answers', () => {
    cart.add(1);

    expect(stock.stock()[1]).toBe(4);
    expect(cart.count()).toBe(1);
  });

  it('keeps the change when the server accepts it', () => {
    cart.add(1);
    reservations(1)[0].flush({ stock: 4 });

    expect(stock.stock()[1]).toBe(4);
    expect(cart.count()).toBe(1);
    expect(cart.error()).toBeNull();
  });

  it('undoes both the stock and the cart when the server refuses', () => {
    cart.add(1);
    reservations(1)[0].flush('sold out', soldOut);

    expect(stock.stock()[1]).toBe(5);
    expect(cart.count()).toBe(0);
    expect(cart.error()).toBe('Could not reserve the item.');
  });

  it('undoes only the failed change when another request succeeded meanwhile', () => {
    cart.add(1);
    cart.add(2);

    reservations(1)[0].flush('sold out', soldOut);
    reservations(2)[0].flush({ stock: 4 });

    expect(stock.stock()).toEqual({ 1: 5, 2: 4, 3: 5 });
    expect(cart.count()).toBe(1);
  });

  it('undoes one unit when the second tap on the same product fails', () => {
    cart.add(1);
    cart.add(1);

    const [first, second] = reservations(1);
    first.flush({ stock: 4 });
    second.flush('sold out', soldOut);

    expect(stock.stock()[1]).toBe(4);
    expect(cart.count()).toBe(1);
  });

  it('gives every user their own cart', () => {
    cart.add(1);
    reservations(1)[0].flush({ stock: 4 });

    session.logout();
    session.login('marcus');
    expect(cart.count()).toBe(0);

    session.login('ana');
    expect(cart.count()).toBe(1);
  });

  it('does not let a late failure of one user touch the next user', () => {
    cart.add(1);
    const [anasRequest] = reservations(1);
    session.logout();
    session.login('marcus');
    cart.add(1);
    const [marcusRequest] = reservations(1);

    anasRequest.flush('sold out', soldOut);
    marcusRequest.flush({ stock: 3 });

    expect(cart.count()).toBe(1);
    expect(stock.stock()[1]).toBe(4);

    session.login('ana');
    expect(cart.count()).toBe(0);
  });
});
