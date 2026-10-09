# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Read `provideApiClient()` line by line. For each interceptor and feature, ask: which requests does this apply to,
and what would a request to a domain you do not control receive from it?

</details>

<details><summary>Hint 2 - area</summary>

- An interceptor runs for **every** request made through `HttpClient`. What tells it that a URL is "ours"?
- Angular ships XSRF protection (cookie `XSRF-TOKEN` read, header `X-XSRF-TOKEN` set on mutating same-origin requests).
  Which line turns it off? Is "we send a bearer token" a reason to turn it off when cookies are also used?
- Look at everything that goes into `console.error`: the URL with its query string, the headers, the body.
  What would you want a log line to contain for debugging, and what does it never need?

</details>

<details><summary>Hint 3 - near the answer</summary>

Only decorate requests whose URL starts with `${API_BASE_URL}/`. Replace `withNoXsrfProtection()` with
`withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })` (or drop the feature to use the
defaults). Log the method, the URL **without** query string and the status; never headers or bodies.

</details>

---

Tests won't catch the token living in `localStorage` (readable by any script that runs in the page, which turns every
XSS into account takeover): it is a review finding with a tradeoff, discussed in `SOLUTION.md`.
