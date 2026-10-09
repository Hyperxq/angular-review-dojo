# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

In a single-page app the browser does not reload, so nothing does the things a page load does for free: announce a new
page, reset focus, change the tab title. Which of those does this shell do?

</details>

<details><summary>Hint 2 - area</summary>

- Which router option gives each route a document title? The `Title` service reads what `TitleStrategy` set.
- After `NavigationEnd`, where should keyboard focus go? A non-interactive element can receive programmatic focus when it
  has `tabindex="-1"`. Why must the focus happen **after** the new view is rendered (`afterNextRender`)?
- An element that appears or changes is only spoken if it lives inside a live region (`role="status"`, polite) that
  already existed. What would you put in it for the filter?
- WCAG 1.4.1 "Use of Color": information conveyed by colour needs a second channel. What is the cheapest one for a status?

</details>

<details><summary>Hint 3 - near the answer</summary>

Add `title` to every route. In the shell give `<main #main tabindex="-1">`, subscribe to `router.events` for
`NavigationEnd` (with `takeUntilDestroyed`) and call `afterNextRender(() => main.focus(), { injector })`. In the list add
`<p role="status">{{ count }} order(s) shown</p>` and render the status as visible text next to the dot (mark the dot
`aria-hidden="true"`).

</details>

---

Tests won't catch contrast ratios (dot vs background, 3:1 for graphical objects) or how a particular screen reader reads
the page title on navigation; test those manually.
