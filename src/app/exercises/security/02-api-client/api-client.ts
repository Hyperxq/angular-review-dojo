import {
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { tap } from 'rxjs';
import { TokenStore } from './token-store';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => '/api' });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).token();
  if (!token || !req.url.startsWith(`${inject(API_BASE_URL)}/`)) {
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
          path: req.url.split('?')[0],
          status: error.status,
        }),
    }),
  );

export function provideApiClient() {
  return provideHttpClient(
    withInterceptors([authInterceptor, errorLoggingInterceptor]),
    withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
  );
}
