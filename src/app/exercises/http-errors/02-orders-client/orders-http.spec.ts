import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideOrdersHttp, RETRY_DELAY, TokenStore, Toasts } from './orders-http';

describe('L2 - orders client', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let toasts: Toasts;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideOrdersHttp(),
        provideHttpClientTesting(),
        { provide: RETRY_DELAY, useValue: 0 },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(Toasts);
  });

  afterEach(() => backend.verify());

  const tick = () => new Promise((resolve) => setTimeout(resolve));
  const serverError = { status: 503, statusText: 'Service Unavailable' };

  async function failAttempts(url: string, count: number) {
    for (let i = 0; i < count; i++) {
      backend.expectOne(url).flush('down', serverError);
      await tick();
    }
  }

  it('sends the token with the first attempt', () => {
    http.get('/api/products').subscribe();

    const req = backend.expectOne('/api/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush([]);
  });

  describe('reads', () => {
    it('are retried twice on server errors, then fail with one message', async () => {
      const outcome = vi.fn();
      http.get('/api/products').subscribe({ error: outcome });

      await failAttempts('/api/products', 2);
      backend.expectOne('/api/products').flush('down', serverError);

      expect(outcome).toHaveBeenCalledOnce();
      expect(toasts.messages()).toEqual(['GET /api/products failed (503)']);
    });

    it('show no message when a retry succeeds', async () => {
      const next = vi.fn();
      http.get('/api/products').subscribe(next);

      await failAttempts('/api/products', 1);
      backend.expectOne('/api/products').flush([{ id: 1 }]);

      expect(next).toHaveBeenCalledWith([{ id: 1 }]);
      expect(toasts.messages()).toEqual([]);
    });

    it('are not retried on client errors', async () => {
      http.get('/api/products/99').subscribe({ error: () => undefined });

      backend
        .expectOne('/api/products/99')
        .flush('missing', { status: 404, statusText: 'Not Found' });
      await tick();

      backend.expectNone('/api/products/99');
      expect(toasts.messages()).toEqual(['GET /api/products/99 failed (404)']);
    });

    it('use the current token on every attempt', async () => {
      http.get('/api/products').subscribe({ error: () => undefined });
      backend.expectOne('/api/products').flush('down', serverError);
      TestBed.inject(TokenStore).token.set('token-2');
      await tick();

      const retried = backend.expectOne('/api/products');
      expect(retried.request.headers.get('Authorization')).toBe('Bearer token-2');
      retried.flush([]);
    });
  });

  describe('writes', () => {
    it('are never retried', async () => {
      const outcome = vi.fn();
      http.post('/api/orders', { lines: [] }).subscribe({ error: outcome });

      backend.expectOne('/api/orders').flush('down', { status: 500, statusText: 'Server Error' });
      await tick();

      backend.expectNone('/api/orders');
      expect(outcome).toHaveBeenCalledOnce();
      expect(toasts.messages()).toEqual(['POST /api/orders failed (500)']);
    });
  });
});
