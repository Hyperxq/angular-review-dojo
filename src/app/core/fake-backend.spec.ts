import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { FAKE_BACKEND_LATENCY, SEED_PRODUCTS, fakeBackendInterceptor } from './fake-backend';
import { Product } from './models';

describe('fakeBackendInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([fakeBackendInterceptor])),
        { provide: FAKE_BACKEND_LATENCY, useValue: 100 },
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => vi.useRealTimers());

  it('answers after the configured latency', async () => {
    const next = vi.fn();
    http.get<Product[]>('/api/products').subscribe(next);

    await vi.advanceTimersByTimeAsync(99);
    expect(next).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(next).toHaveBeenCalledWith(SEED_PRODUCTS);
  });

  it('lets a request override the latency', async () => {
    const next = vi.fn();
    http.get('/api/products', { params: { latency: 10 } }).subscribe(next);

    await vi.advanceTimersByTimeAsync(10);
    expect(next).toHaveBeenCalled();
  });

  it('filters by search term and category', async () => {
    const byTerm = vi.fn();
    const byCategory = vi.fn();
    http.get<Product[]>('/api/products', { params: { q: 'KEY' } }).subscribe(byTerm);
    http.get<Product[]>('/api/products', { params: { category: 'mice' } }).subscribe(byCategory);

    await vi.advanceTimersByTimeAsync(100);
    expect(byTerm.mock.calls[0][0].every((p: Product) => /key/i.test(p.name))).toBe(true);
    expect(byTerm.mock.calls[0][0].length).toBeGreaterThan(0);
    expect(byCategory.mock.calls[0][0].every((p: Product) => p.category === 'mice')).toBe(true);
  });

  it('fails with a 500 when asked to', async () => {
    const error = vi.fn();
    http.get('/api/products', { params: { fail: 1 } }).subscribe({ error });

    await vi.advanceTimersByTimeAsync(100);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  });

  it('fails with a 404 for unknown resources', async () => {
    const error = vi.fn();
    http.get('/api/products/9999').subscribe({ error });

    await vi.advanceTimersByTimeAsync(100);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
  });

  it('keeps stock in memory when reserving', async () => {
    const target = SEED_PRODUCTS.find((p) => p.stock > 1)!;
    const reserved = vi.fn();
    const stock = vi.fn();
    http.post(`/api/stock/${target.id}/reserve`, null).subscribe(reserved);
    await vi.advanceTimersByTimeAsync(100);
    http.get('/api/stock').subscribe(stock);
    await vi.advanceTimersByTimeAsync(100);

    expect(reserved).toHaveBeenCalledWith({ stock: target.stock - 1 });
    expect(stock.mock.calls[0][0][target.id]).toBe(target.stock - 1);
  });
});
