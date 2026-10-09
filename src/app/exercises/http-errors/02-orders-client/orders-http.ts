import {
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { InjectionToken, Service, inject, signal } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';

@Service()
export class Toasts {
  readonly messages = signal<string[]>([]);

  show(message: string) {
    this.messages.update((messages) => [...messages, message]);
  }
}

@Service()
export class TokenStore {
  readonly token = signal('token-1');
}

export const RETRY_DELAY = new InjectionToken<number>('RETRY_DELAY', { factory: () => 300 });

export const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Authorization: `Bearer ${inject(TokenStore).token()}` } }));

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const delay = inject(RETRY_DELAY);
  return next(req).pipe(retry({ count: 2, delay: (_error, attempt) => timer(delay * attempt) }));
};

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toasts = inject(Toasts);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      toasts.show(`${req.method} ${req.url} failed (${error.status})`);
      return throwError(() => error);
    }),
  );
};

export function provideOrdersHttp() {
  return provideHttpClient(
    withInterceptors([authInterceptor, retryInterceptor, errorToastInterceptor]),
  );
}
