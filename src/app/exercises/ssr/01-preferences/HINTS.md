# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

List every global (`window`, `document`, `localStorage`, `matchMedia`) the class touches and **when** each one is
touched: while the object is being constructed, or later, in response to something the user did.

</details>

<details><summary>Hint 2 - area</summary>

- Code that runs while a component is created also runs on the server. What does the server not have?
- Angular has a hook that runs **only in the browser**, once, after the first render. Which one? (`afterNextRender`
  and `afterEveryRender` never run during server rendering.)
- For the document itself you do not need a global: there is an injection token for it, and a `Title` service.
- `isPlatformBrowser(inject(PLATFORM_ID))` is the explicit alternative. When is it the better tool?
- The initial state must be the same on the server and on the first client render, otherwise the page flickers (or
  mismatches when hydrated). What should `dark` and `width` be before the browser takes over?

</details>

<details><summary>Hint 3 - near the answer</summary>

Start with `dark = signal(false)` and `width = signal<number | null>(null)`. Inject `DOCUMENT` and `Title`; set the
title with `Title`. In `afterNextRender(() => { ... })` read `localStorage`, `matchMedia` and `innerWidth` and set the
signals. Event handlers (`toggle`, `onResize`) only run in the browser, so they may use the globals, but going through
`inject(DOCUMENT)` keeps them testable.

</details>

---

Tests won't catch every item here: they simulate the server by hiding a few globals, they do not run a real server
renderer. See `SOLUTION.md` for what that does and does not prove.
