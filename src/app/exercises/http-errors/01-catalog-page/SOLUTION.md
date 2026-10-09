# L1 - Catalog page: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `catchError(() => of([]))` converts every failure into "an empty list": the UI shows "No products found." for an outage, nothing is reported, and there is no retry. | **blocking** |
| 2 | `AppErrorHandler` only prints to the console, so unexpected errors never reach error tracking. | **blocking** |
| 3 | No distinction between kinds of failure (offline, 4xx, 5xx) in the message. | nit |
| 4 | `console.error` is used in the handler; there is no sampling/deduplication when the same error fires in a loop. | question |

## Why

An error is information. Each layer may handle it, translate it, or let it pass, but never silently turn it into a valid
value of the success type. The success channel (`[]`) must mean success. Resources make the three states explicit:
`isLoading()`, `error()` and `value()` (verified: reading `value()` in the error state **throws**, so the template checks
`error()` first). Reserve `catchError` for places where you have a meaningful fallback or a translation to a domain error,
and always log/report when you do.

The `ErrorHandler` token is the last line of defense: Angular calls it for errors thrown in templates, event handlers and
unhandled promise rejections (and for errors forwarded by `provideBrowserGlobalErrorListeners()`, which this app uses).
Anything that should leave the browser, such as a call to Sentry, goes there. Expected HTTP failures are already
handled by the page and need not be reported as crashes.

## The fix

```ts
protected readonly products = rxResource({ stream: () => this.api.list() });
```
```html
@if (products.error()) { <div role="alert">We could not load the products. <button (click)="products.reload()">Try again</button></div> }
```
```ts
handleError(error: unknown) { console.error(error); this.reporter.report(error); }
```

## Tradeoffs and discussion

- **Stale-while-error:** keeping the previous list on screen with an inline error banner beats replacing the page when a
  refresh fails. `value()` is not available in the error state, so cache the last good value yourself if you want this.
- **Where to report HTTP errors:** a single interceptor can report 5xx/network errors with the URL and status; the page then only
  decides how to *show* it (see L2).
- **`role="alert"`:** failures should be announced (see the a11y track).

## What a reviewer should say in the PR comment

> **Blocking:** `catchError(() => of([]))` makes a failed request look like an empty catalog and hides the outage; let the
> error reach the resource and render it (with retry). **Blocking:** the global `ErrorHandler` only logs, so production errors are
> invisible; forward to the reporting service. *Nit:* differentiate offline from server errors in the copy.
