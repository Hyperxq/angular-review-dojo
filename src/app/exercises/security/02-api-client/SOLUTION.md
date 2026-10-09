# L2 - API client: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `authInterceptor` decorates **every** request, so the bearer token (and `withCredentials`) goes to the analytics vendor. | **blocking** |
| 2 | `withNoXsrfProtection()` disables Angular's CSRF defense while the API also authenticates with a session cookie. | **blocking** |
| 3 | `errorLoggingInterceptor` logs the query string, all headers (including `Authorization`) and the body: PII and credentials in logs and in whatever tool collects them. | **blocking** |
| 4 | The access token lives in `localStorage`: any XSS can read it. | should-fix (tradeoff, see below) |
| 5 | The interceptor ordering is fine, but `withCredentials: true` is added to every authenticated call even if the API is same-origin. | nit |

## Why

- An interceptor is a global filter. "Is this request ours?" is a decision the interceptor must make; the usual rule is
  an allowlist on the base URL (`startsWith(`${API_BASE_URL}/`)`, never `includes`, which matches `evil.example/?x=/api/`).
- Angular's XSRF protection (verified in `@angular/common`): on a non-`GET`/`HEAD` request to the **same origin** it
  reads the `XSRF-TOKEN` cookie and copies it into `X-XSRF-TOKEN`. It is on by default. Bearer tokens kept in memory are
  not sent automatically by the browser, so they are not CSRF-prone; cookies are. The moment the API accepts a session
  cookie, CSRF protection is needed again. `withXsrfConfiguration(...)` only matters if the backend uses other names.
- `req.url` keeps whatever query string you wrote in the URL; `req.params` only exist when you used the `params` option.
  `urlWithParams` includes both. Log the path, never the URL with its query: tokens, emails and ids tend to travel there.

## The fix

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).token();
  if (!token || !req.url.startsWith(`${inject(API_BASE_URL)}/`)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true }));
};

console.error('API request failed', { method: req.method, path: req.url.split('?')[0], status: error.status });

provideHttpClient(withInterceptors([...]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }));
```

## Tradeoffs and discussion

- **Token in `localStorage` vs. an HttpOnly cookie:** storage is readable by XSS, an HttpOnly + `SameSite` cookie is not,
  but then CSRF protection is mandatory (this exercise) and CORS/credentials get harder. Keeping the access token only in
  memory (short-lived) plus an HttpOnly refresh cookie is the common compromise; it costs a refresh on page load.
- **Allowlist in the interceptor vs. `HttpContext` opt-in:** a context token (`SKIP_AUTH`) is convenient but fails open;
  an allowlist fails closed. Prefer the second for credentials.
- **Logging for debugging:** if you need request detail, log it behind an opt-in debug flag and redact; do not make it the
  default of a production interceptor.

## What a reviewer should say in the PR comment

> **Blocking:** the auth interceptor adds the bearer token to every request, including third parties. Restrict it to
> `API_BASE_URL`. **Blocking:** XSRF protection is disabled but the API uses cookies: restore the default (or configure
> names); the backend will reject mutations otherwise. **Blocking:** the failure log prints headers, body and the query
> string (token, email, card): log method, path and status only. *Should-fix:* where is the token stored, and what is our
> XSS story? *Nit:* `withCredentials` only if the API is cross-origin.
