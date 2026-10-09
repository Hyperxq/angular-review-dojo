import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideApiClient } from './api-client';
import { TokenStore } from './token-store';

describe('L2 - API client', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideApiClient(), provideHttpClientTesting()] });
    TestBed.inject(TokenStore).set('tok-123');
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    backend.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('bearer token', () => {
    it('is sent to our API', () => {
      http.get('/api/products').subscribe();

      const req = backend.expectOne('/api/products');
      expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
      req.flush([]);
    });

    it('is never sent to another domain', () => {
      http.post('https://analytics.thirdparty.example/collect', { page: '/checkout' }).subscribe();

      const req = backend.expectOne('https://analytics.thirdparty.example/collect');
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(req.request.withCredentials).toBe(false);
      req.flush(null);
    });

    it('is not confused by a look-alike path', () => {
      http.get('/apiary/products').subscribe();

      const req = backend.expectOne('/apiary/products');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });
  });

  describe('CSRF protection', () => {
    it('sends the XSRF header on state-changing calls to our API', () => {
      document.cookie = 'XSRF-TOKEN=csrf-123';

      http.post('/api/orders', { lines: [] }).subscribe();

      const req = backend.expectOne('/api/orders');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-123');
      req.flush({});
    });

    it('does not add it to reads', () => {
      document.cookie = 'XSRF-TOKEN=csrf-123';

      http.get('/api/products').subscribe();

      const req = backend.expectOne('/api/products');
      expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);
      req.flush([]);
    });
  });

  describe('failure logs', () => {
    it('contain no personal data or credentials', () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      http
        .post('/api/payments?email=ana@example.com', { card: '4111111111111111' })
        .subscribe({ error: () => undefined });
      backend
        .expectOne((r) => r.url.startsWith('/api/payments'))
        .flush('declined', { status: 502, statusText: 'Bad Gateway' });

      const logged = JSON.stringify(log.mock.calls);
      expect(log).toHaveBeenCalled();
      expect(logged).not.toContain('ana@example.com');
      expect(logged).not.toContain('4111111111111111');
      expect(logged).not.toContain('tok-123');
    });

    it('still say what failed', () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      http.get('/api/products').subscribe({ error: () => undefined });
      backend.expectOne('/api/products').flush('boom', { status: 500, statusText: 'Server Error' });

      const logged = JSON.stringify(log.mock.calls);
      expect(logged).toContain('/api/products');
      expect(logged).toContain('500');
    });
  });
});
