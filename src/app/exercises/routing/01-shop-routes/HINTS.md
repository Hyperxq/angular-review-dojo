# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

There are three separate problems and none of them is in a component template. Look at the route
configuration file.

</details>

<details><summary>Hint 2 - area</summary>

- The router walks the `Routes` array top to bottom and takes the **first** route that matches.
  Which entries could swallow a URL that was meant for a later entry?
- A guard that returns `false` cancels the navigation. What does the user see afterwards?

</details>

<details><summary>Hint 3 - near the answer</summary>

Put specific routes before parameterised ones (`products/new` before `products/:id`) and the
wildcard `**` last. For the guard, return a `UrlTree` (`router.createUrlTree(...)` or
`router.parseUrl(...)`) instead of `false`, so the router redirects.

</details>
