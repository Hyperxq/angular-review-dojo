# L4 - Category browser

**Reported by:** On-call  |  **Area:** Catalog  |  **Priority:** High

## What we see

- During last night's partial outage of the products API, our API dashboard showed bursts of
  identical category requests, several per user within the same second, right when the backend was
  already struggling.
- Several users reported that after the "We could not load the products" message appeared, clicking
  the other category tabs did nothing at all. Only a full page reload brought the page back, even
  after the backend had recovered.

## Expected

If the API is struggling the page should back off instead of piling on, and a failed category must
not break the other tabs.
