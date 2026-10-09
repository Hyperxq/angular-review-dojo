import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs';
import { NewAlert, PriceAlert } from './alert.models';

const alerts: PriceAlert[] = [];
let nextId = 1;

export const alertsDemoBackend: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.urlWithParams, 'http://demo.local');
  if (!url.pathname.startsWith('/api/alerts')) {
    return next(req);
  }
  const id = Number(url.pathname.split('/')[3]);

  if (req.method === 'GET') {
    const term = url.searchParams.get('product')?.toLowerCase() ?? '';
    const body = alerts.filter((a) => a.productName.toLowerCase().includes(term));
    return of(new HttpResponse({ status: 200, body })).pipe(delay(100));
  }
  if (req.method === 'POST') {
    const created: PriceAlert = {
      ...(req.body as NewAlert),
      id: nextId++,
      createdAt: new Date().toISOString(),
    };
    alerts.push(created);
    return of(new HttpResponse({ status: 201, body: created })).pipe(delay(100));
  }
  const index = alerts.findIndex((a) => a.id === id);
  if (index < 0) {
    return throwError(() => new HttpErrorResponse({ status: 404, url: req.url }));
  }
  alerts.splice(index, 1);
  return of(new HttpResponse({ status: 204, body: null })).pipe(delay(100));
};
