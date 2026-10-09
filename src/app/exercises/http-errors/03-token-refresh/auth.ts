import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import {
  Subject,
  catchError,
  map,
  share,
  switchMap,
  takeUntil,
  tap,
  throwError,
  throwIfEmpty,
} from 'rxjs';

export class AuthError extends Error {
  constructor(readonly reason: 'expired' | 'ended') {
    super(reason === 'expired' ? 'Your session expired' : 'You signed out');
  }
}

const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly loggedOut = new Subject<void>();

  readonly token = signal<string | null>('access-1');
  readonly sessionEnded$ = this.loggedOut.pipe(
    switchMap(() => throwError(() => new AuthError('ended'))),
  );

  private readonly refresh$ = this.http
    .post<{ token: string }>('/auth/refresh', null, {
      context: new HttpContext().set(SKIP_AUTH, true),
    })
    .pipe(
      map((response) => response.token),
      tap((token) => this.token.set(token)),
      takeUntil(this.loggedOut),
      throwIfEmpty(() => new AuthError('ended')),
      catchError((error: unknown) => {
        if (error instanceof AuthError) {
          return throwError(() => error);
        }
        this.token.set(null);
        return throwError(() => new AuthError('expired'));
      }),
      share(),
    );

  refresh() {
    return this.refresh$;
  }

  logout() {
    this.token.set(null);
    this.loggedOut.next();
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }
  const auth = inject(AuthService);
  const withToken = (token: string | null) =>
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(withToken(auth.token())).pipe(
    catchError((error: HttpErrorResponse) =>
      error.status === 401
        ? auth.refresh().pipe(switchMap((token) => next(withToken(token))))
        : throwError(() => error),
    ),
    takeUntil(auth.sessionEnded$),
  );
};

export function provideAuthHttp() {
  return provideHttpClient(withInterceptors([authInterceptor]));
}
