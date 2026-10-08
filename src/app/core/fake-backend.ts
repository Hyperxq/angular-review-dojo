import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';
import { Category, Order, OrderReceipt, Product } from './models';

export const SEED_CATEGORIES: readonly Category[] = [
  { id: 'keyboards', name: 'Keyboards', description: 'Mechanical and low-profile keyboards' },
  { id: 'mice', name: 'Mice', description: 'Wired and wireless pointing devices' },
  { id: 'monitors', name: 'Monitors', description: 'Displays from 24 to 34 inches' },
  { id: 'audio', name: 'Audio', description: 'Headsets and speakers' },
];

export const SEED_PRODUCTS: readonly Product[] = [
  { id: 1, name: 'Keychron K2 Keyboard', price: 89, category: 'keyboards', stock: 12 },
  { id: 2, name: 'Ducky One 3 Keyboard', price: 119, category: 'keyboards', stock: 5 },
  { id: 3, name: 'NuPhy Air75 Keyboard', price: 109, category: 'keyboards', stock: 0 },
  { id: 4, name: 'Logitech MX Master 3S', price: 99, category: 'mice', stock: 20 },
  { id: 5, name: 'Razer DeathAdder V3', price: 69, category: 'mice', stock: 7 },
  { id: 6, name: 'Glorious Model O', price: 59, category: 'mice', stock: 2 },
  { id: 7, name: 'Dell U2723QE 27" Monitor', price: 549, category: 'monitors', stock: 4 },
  { id: 8, name: 'LG UltraGear 34" Monitor', price: 449, category: 'monitors', stock: 9 },
  { id: 9, name: 'BenQ GW2480 24" Monitor', price: 159, category: 'monitors', stock: 15 },
  { id: 10, name: 'Sony WH-1000XM5 Headset', price: 349, category: 'audio', stock: 6 },
  { id: 11, name: 'Audio-Technica ATH-M50x', price: 149, category: 'audio', stock: 11 },
  { id: 12, name: 'Creative Pebble Speakers', price: 39, category: 'audio', stock: 1 },
];

export const FAKE_BACKEND_LATENCY = new InjectionToken<number>('FAKE_BACKEND_LATENCY', {
  factory: () => 150,
});

@Injectable({ providedIn: 'root' })
export class FakeDb {
  readonly products: Product[] = structuredClone([...SEED_PRODUCTS]);
  nextOrderId = 1;
}

/**
 * In-memory API. Query params: `latency=<ms>` overrides the default delay,
 * `fail=1` answers with a 500.
 */
export const fakeBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.urlWithParams, 'http://fake.local');
  if (!url.pathname.startsWith('/api/')) {
    return next(req);
  }

  const db = inject(FakeDb);
  const latency = Number(url.searchParams.get('latency') ?? inject(FAKE_BACKEND_LATENCY));
  const httpError = (status: number, statusText: string) =>
    throwError(() => new HttpErrorResponse({ status, statusText, url: req.url }));

  return timer(latency).pipe(
    switchMap((): Observable<HttpEvent<unknown>> => {
      if (url.searchParams.has('fail')) {
        return httpError(500, 'Internal Server Error');
      }
      const result = route(req.method, url.pathname.slice('/api'.length), url.searchParams, req.body, db);
      return result ? of(new HttpResponse({ status: 200, body: result.body })) : httpError(404, 'Not Found');
    }),
  );
};

function route(
  method: string,
  path: string,
  query: URLSearchParams,
  body: unknown,
  db: FakeDb,
): { body: unknown } | undefined {
  if (method === 'GET' && path === '/products') {
    const term = query.get('q')?.toLowerCase();
    const category = query.get('category');
    return {
      body: db.products.filter(
        (p) => (!term || p.name.toLowerCase().includes(term)) && (!category || p.category === category),
      ),
    };
  }

  if (method === 'GET' && path === '/stock') {
    return { body: Object.fromEntries(db.products.map((p) => [p.id, p.stock])) };
  }

  if (method === 'POST' && path === '/orders') {
    const lines = (body as Order).lines;
    const total = lines.reduce(
      (sum, l) => sum + l.quantity * (db.products.find((p) => p.id === l.productId)?.price ?? 0),
      0,
    );
    const receipt: OrderReceipt = { orderId: db.nextOrderId++, total };
    return { body: receipt };
  }

  const category = path.match(/^\/categories\/(\w+)$/);
  if (method === 'GET' && category) {
    const found = SEED_CATEGORIES.find((c) => c.id === category[1]);
    return found && { body: found };
  }

  const product = path.match(/^\/products\/(\d+)$/);
  const reserve = path.match(/^\/stock\/(\d+)\/reserve$/);
  const id = Number((product ?? reserve)?.[1]);
  const target = db.products.find((p) => p.id === id);
  if (!target) {
    return undefined;
  }
  if (method === 'GET' && product) {
    return { body: target };
  }
  if (method === 'PUT' && product) {
    Object.assign(target, body, { id });
    return { body: target };
  }
  if (method === 'POST' && reserve && target.stock > 0) {
    target.stock -= 1;
    return { body: { stock: target.stock } };
  }
  return undefined;
}
