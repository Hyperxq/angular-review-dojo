# S3 - Product page: solution

## What was wrong

**The behavioural bugs**

1. `loading` was set to `true` on every param change but only set back to `false` in the `next`
   callback. On error it stayed `true` forever: loading and error shown together.
2. `error` was set but never cleared, so the previous error leaked into the next load.
3. The error handler was on the **outer** `paramMap` subscription. The first error from the
   inner request terminated the whole pipeline, so later route changes were ignored: the page
   was dead until reload. (Same lesson as RxJS L4: handle errors on the inner observable.)

**The smells that made it possible**: `ActivatedRoute.paramMap` + `switchMap` + `takeUntil(destroy$)` +
`ngOnDestroy`, and three signals (`product`, `loading`, `error`) maintained by hand in a pipeline
that is itself the source of the bugs.

## The fix

```ts
readonly id = input.required({ transform: numberAttribute });

protected readonly product = rxResource({
  params: () => this.id(),
  stream: ({ params: id }) => this.api.get(id),
});
```

- `withComponentInputBinding()` (enabled in `app.config.ts`) binds the `:id` route param to
  the `id` input. Route params are strings, hence `numberAttribute`.
- `rxResource` owns the whole lifecycle: a new `id` cancels the in-flight request, resets the
  state and starts again; an error only affects the current request. `isLoading()`, `error()`,
  `value()` and `hasValue()` always agree because they derive from one status.
- No `ngOnDestroy`, no `Subject`, no `takeUntil`.

## `rxResource` or `httpResource`?

If the component can talk HTTP directly, `httpResource` is even shorter. Signature verified in
the Angular 22 type definitions: it takes a function returning the URL (or `undefined` to stay
idle) or a request object, plus `{ parse, defaultValue, injector, equal }` options:

```ts
protected readonly product = httpResource<Product>(() => `/api/products/${this.id()}`);
```

Here the exercise goes through `ProductApi`, so `rxResource` (observable in, signals out) is the
natural choice. Note the options differ from the Angular 19 developer preview: `params`/`stream` for
`rxResource`, no more `request`/`loader`.

## Modern Angular takeaway

- Data that depends on the URL: route param -> `input()` -> resource. The component declares
  *what* it needs; loading/error/cancellation are not its business.
- Hand-written `loading`/`error` flags are a smell: they are derived state and must be kept in sync
  on every path. Prefer one source of truth (the resource status).
- Test it through the router (`RouterTestingHarness`) so the spec does not care whether the id comes
  from `paramMap` or from an input binding.

## What a reviewer should say in the PR comment

> `loading` is never reset on error and `error` is never cleared, and since the error handler is
> on the outer `paramMap` stream, the first failure also kills route handling for this component.
> Replace the subscription and the three flags with `input()` (via `withComponentInputBinding`)
> and an `rxResource`/`httpResource` keyed on the id.
