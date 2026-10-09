# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Which of these files has the word "trust" or "bypass" in it, and what data goes through it?
Which data in this feature is written by someone who is not on your team?

</details>

<details><summary>Hint 2 - area</summary>

- Angular sanitizes values bound to `[innerHTML]` and to URL attributes such as `href` by default. What does the
  pipe do to that protection, and who benefits from it?
- The redirect receives a string from the address bar. What can a string like `//host`, `https://host` or
  `javascript:...` do when it is handed to `location.assign`? Which strings are really "a path on my site"?
- How would you decide "same site" without writing a regular expression you will get wrong? The WHATWG `URL`
  class applies the same parsing rules as the browser.

</details>

<details><summary>Hint 3 - near the answer</summary>

Delete both pipes and bind `review.comment` and `review.website` directly: the built-in sanitizer keeps `<b>`
and `<a>` and neutralizes `onerror` and `javascript:`. For the redirect, resolve `returnUrl` against a dummy
origin with `new URL(value, 'http://app.invalid')` and only keep the path, query and hash when the resulting
origin is still that dummy origin; otherwise use `/`.

</details>

---

Tests won't catch everything: `rel="noopener"` without `noreferrer`, rendering a link at all when the URL is not
`http(s)`, and the absence of a Content-Security-Policy are review findings, not test failures.
