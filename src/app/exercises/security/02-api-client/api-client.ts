import {
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
  withNoXsrfProtection,
} from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { tap } from 'rxjs';
import { TokenStore } from './token-store';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => '/api' });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).token();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true }),
  );
};

export const errorLoggingInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    tap({
      error: (error: HttpErrorResponse) =>
        console.error('API request failed', {
          method: req.method,
          url: req.urlWithParams,
          headers: Object.fromEntries(req.headers.keys().map((key) => [key, req.headers.get(key)])),
          body: req.body,
          status: error.status,
        }),
    }),
  );

export function provideApiClient() {
  return provideHttpClient(
    withInterceptors([authInterceptor, errorLoggingInterceptor]),
    withNoXsrfProtection(),
  );
}
