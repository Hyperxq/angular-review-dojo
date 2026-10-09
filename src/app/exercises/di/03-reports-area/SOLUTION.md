# L3 - Reports area: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `provideHttpClient(...)` in the lazy route's `providers` creates an independent `HttpClient` that does **not** inherit the root interceptors (nor the fake backend / testing backend). | **blocking** |
| 2 | `AuditLog` is auto-provided in root and also listed in the route's `providers`: the area gets a second instance and the app-wide log never sees its entries. | **blocking** |
| 3 | `Selection` is auto-provided in root and also in the page's `providers`: the page and the shell's badge have different instances. | **blocking** |
| 4 | Several injector levels re-declare services without a comment saying why: a standing source of this class of bug. | should-fix |
| 5 | The area's header lives in the shell and depends on state owned by a child page: the ownership is inverted (see below). | question |

## Why

- **Injector tree.** `Route.providers` creates an environment injector per route; `Component.providers` creates a node
  injector entry per component instance. `inject(X)` asks the nearest injector first and climbs. A class that is auto-provided
  in root **and** listed in a lower level exists twice, and which copy you get depends on *where you ask from*.
- **`provideHttpClient` is not additive.** Called in a child injector it configures a new client. Interceptors of the parent are
  skipped unless you add `withRequestsMadeViaParent()` (verified in the HTTP types: once the request has passed through the
  current injector's interceptors it is delegated to the parent's client). It cannot be combined with `withFetch()`/`withXhr()`
  in the same call.
- **Re-providing is the exception.** Provide a service again only to deliberately scope it. If the intent is "share with everybody", delete
  the lower-level provider.

## The fix

```ts
providers: [provideHttpClient(withRequestsMadeViaParent(), withInterceptors([reportsScopeInterceptor]))]
// no AuditLog in the route providers; no Selection in the page providers
```

## Tradeoffs and discussion

- **Who owns `Selection`?** Root scope is the simplest way to let the shell see the page's selection, but it means the selection
  survives leaving and re-entering the area. If it should die with the area, scope it on the area's **parent** route
  (`providers: [Selection]` on the route that also holds the shell and the page), so both resolve the same instance and it is destroyed on exit.
  Component `providers` can never be seen by an ancestor.
- **Feature-level interceptor vs. interceptor with URL check:** a route-level client with its own interceptor keeps the feature self-contained;
  a global interceptor with a path check is easier to find. Pick one, and be explicit.
- **Lazy routes and singleton services:** `providedIn: 'root'`/`@Service()` classes live in the root injector even if only a lazy bundle
  imports them (the code lands in that bundle); that is a feature, not a duplication.

## What a reviewer should say in the PR comment

> **Blocking:** `provideHttpClient` inside the route creates a separate client with none of the app interceptors (trace id, auth, fake
> backend). If the area needs its own interceptor use `withRequestsMadeViaParent()`. **Blocking:** `AuditLog` and `Selection` are
> already provided in root; listing them in the route/component providers creates second instances, so the shell never sees what the
> page does. Delete the redundant providers (or, if the selection should be area-scoped, provide it once on the parent route).
