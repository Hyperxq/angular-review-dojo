# L2 - Orders client (interceptor chain)

**Reported by:** Finance, Support and QA  |  **Area:** HTTP client setup  |  **Priority:** Critical

## What we see

1. Customers were charged twice. Looking at the payment provider's log, the order endpoint received the same order up to
   three times, a few hundred milliseconds apart, whenever the provider answered with a `500` the first time.
2. When one request fails the screen shows three identical red toasts ("GET /api/products failed (503)") even though the
   request is retried and the third attempt succeeds, in which case the customer should not see any error at all.
3. A request that gets `404 Not Found` (a product that no longer exists) is also repeated twice before the error shows.
4. After the customer logs in again (new token) while a failing request is being retried, the retries still go out with
   the old token and are rejected with `401`.

## Expected

A failed call is retried only when that is safe (idempotent reads, server or network failures), exactly once per failure
shows one message and only when the call finally fails, and every retry uses the current token.
