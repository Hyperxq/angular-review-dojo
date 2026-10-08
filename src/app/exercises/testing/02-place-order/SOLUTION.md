# L2 - Place order: solution

## What was wrong

**The code:** `OrderClient.submit` ended with `retry(2)`. Retrying is safe for idempotent reads;
`POST /api/orders` creates something each time it succeeds. When the payment provider answered `500` *after*
recording the order, the retry created another one. The user saw one failure message for two (or three)
orders.

**The tests (why CI stayed green):**

1. **Testing the mock.** `OrderClient` was tested with a hand-made `HttpClient` returning `of(receipt)`. The
   assertions (`post` was called, the receipt equals what the mock returned) are true whatever the service does, and
   the operators in its pipe (`retry`) never see an error. Replace collaborators you do not own at the boundary
   (`provideHttpClientTesting`), not the class under test.
2. **`HttpTestingController` without `verify()`.** The component test used it but never asserted that nothing
   else was pending, so any extra request went unnoticed. Call `http.verify()` in `afterEach`, and use
   `expectOne`/`expectNone` to say how many requests you expect.
3. **No failure test.** The only path covered was the happy one. The retry bug needs an error to show up.
4. **CSS-class selectors (`.btn-primary`, `.msg-ok`).** They break on a restyle and say nothing about what the user
   sees. Query the button by its text, and the messages by role (`[role=status]`, `[role=alert]`), which
   are also accessibility contracts.
5. **`vi.useFakeTimers()` never restored.** Fake timers are global. Every test that runs after it in the same
   file (or worker) silently gets a frozen clock. Always restore in `afterEach(() => vi.useRealTimers())`.

## The fix

```ts
submit(order: Order) {
  return this.http.post<OrderReceipt>('/api/orders', order);
}
```
```ts
afterEach(() => { http.verify(); vi.useRealTimers(); });
...
http.expectOne('/api/orders').flush('boom', { status: 500, statusText: 'Server Error' });
expect(errors).toHaveLength(1);
http.expectNone('/api/orders');
```

If a retry is wanted for a write, make it safe: send an idempotency key and let the server dedupe, then add
a test that the key is the same on every attempt.

## Modern Angular takeaway

- Test through `provideHttpClient()` + `provideHttpClientTesting()`: it exercises interceptors, operators and
  serialisation. The legacy `HttpClientTestingModule` is deprecated in favour of these providers.
- Zoneless TestBed: use `await fixture.whenStable()` (or explicit `detectChanges()` when fake timers
  are active, because `whenStable` would wait on timers that never advance).

## What a reviewer should say in the PR comment

> This spec mocks `HttpClient` itself, so it tests the mock: use `provideHttpClientTesting` and cover the error path,
> and call `verify()` so extra requests fail the test. Query by text/role, not CSS classes, and restore fake
> timers in `afterEach`. Separately, `retry(2)` on a `POST` can create duplicate orders.
