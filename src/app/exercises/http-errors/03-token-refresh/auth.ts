import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { catchError, map, switchMap, tap, throwError } from 'rxjs';

export class AuthError extends Error {
  constructor(readonly reason: 'expired' | 'ended') {
    super(reason === 'expired' ? 'Your session expired' : 'You signed out');
  }
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>('access-1');

  refresh() {
    return this.http.post<{ token: string }>('/auth/refresh', null).pipe(
      map((response) => response.token),
      tap((token) => this.token.set(token)),
    );
  }

  logout() {
    this.token.set(null);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const authed = req.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } });

  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(switchMap(() => next(authed)));
    }),
  );
};

export function provideAuthHttp() {
  return provideHttpClient(withInterceptors([authInterceptor]));
}
