# L2 - Chart frame: solution

## What was wrong

1. **`@ViewChild` read in `ngOnInit`.** View queries are resolved while the view is rendered. At `ngOnInit` the template has not
   been created yet, and an element inside `@if` is created (and destroyed) later, whenever the condition changes. The optional
   chain `this.legend?.` made the failure silent, and even a value read at `ngAfterViewInit` would not follow the `@if` toggling.
   For a static attribute the answer is not to query at all: write `aria-live="polite"` in the template. When imperative
   access is really needed, use a signal query `viewChild()`, which tracks the element as it appears and disappears, and read it
   in an `effect` or `computed`.
2. **State assigned in `ngAfterViewInit` that the template reads.** The template had already been rendered with `0`. The component
   is OnPush, so nothing refreshed it (in an `Eager` component the dev-mode check would throw NG0100: see Change detection L2).
   Measuring the DOM is a job for the render hooks, and the measured value belongs in a signal.
3. **Work in `ngAfterViewChecked`.** It runs after every check of the view. Recomputing ticks there is wasted work on every
   pass; derived values are `computed` and re-run only when `width` changes.
4. **DOM access in a lifecycle hook that also runs on the server.** `ngAfterViewInit` runs during server-side rendering, where there
   is no layout and `offsetWidth` is meaningless (or the element is a stub). `afterNextRender` and `afterEveryRender` are not
   executed on the server, so browser-only code belongs there.

## The fix

```ts
readonly showLegend = input(false);
protected readonly width = signal(0);
protected readonly ticks = computed(() => this.calculator.ticks(this.width()));

constructor() {
  afterNextRender({ read: () => this.width.set(this.plot().nativeElement.offsetWidth) });
}
```
```html
<ul class="legend" aria-live="polite"> ... </ul>
```

## Render hook cheat sheet (verified in the Angular 22 type definitions)

| Function | Runs | Notes |
|----------|------|-------|
| `afterNextRender(cb or spec)` | once, after the next render | browser only; phases `earlyRead`, `write`, `mixedReadWrite`, `read` |
| `afterEveryRender(cb or spec)` | after every render | same phases; remember to keep it cheap |
| `afterRenderEffect(...)` | after render, re-run when the signals it reads change | the right tool for "re-measure when this input changes" |

Use the `read` phase to measure and the `write` phase to mutate, so the browser lays out once (see Memory L3).

## What a reviewer should say in the PR comment

> The legend query is resolved after `ngOnInit` (and the element is created later by `@if`), so the `aria-live` is never set: make it a
> template attribute. Width is measured in `ngAfterViewInit` into a plain field the template already rendered, ticks are recomputed in
> `ngAfterViewChecked` on every pass, and both touch the DOM in a hook that also runs on the server. Use `afterNextRender({ read })`,
> a `width` signal and a `computed` for ticks.
