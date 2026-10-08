# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Count what the component *starts* in `ngOnInit`: every `addEventListener`, every `listen`, every timer. Then count
what `ngOnDestroy` stops.

</details>

<details><summary>Hint 2 - area</summary>

- `window.addEventListener('resize', fn)` lives until someone calls `removeEventListener` with the same `fn`.
- `Renderer2.listen('document', ...)` returns something. What? Who uses it?
- `setInterval` returns an id for a reason.
- Angular can register and remove window/document listeners for you through the `host` metadata of the component
  (`'(window:resize)': '...'`). And `DestroyRef` runs cleanups without an `ngOnDestroy` class member.

</details>

<details><summary>Hint 3 - near the answer</summary>

`host: { '(window:resize)': 'measure()', '(document:keydown)': 'onKey($event)' }` and
`const timer = setInterval(...); inject(DestroyRef).onDestroy(() => clearInterval(timer));`
(or the function returned by `renderer.listen`, called in `onDestroy`).

</details>
