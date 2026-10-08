# L3 - Sales dashboard: solution

## What was wrong

1. **An `effect` that created and initialised a new `FakeChart` on every run, with no cleanup.** `effect` re-runs whenever a
   signal it reads changes (`series()`), so every "New data" created another chart: each one adds a `resize` listener and
   starts its own `requestAnimationFrame` loop, and nobody ever called `destroy()`. A third-party widget is *imperative*: its
   lifecycle is `init` once, `update` many times, `destroy` once. Mapping that onto Angular means
   create in a render hook (it needs the DOM), update in an effect, destroy in `DestroyRef.onDestroy`.
2. **A template method (`stats()`) doing O(n²) work.** The template ran it on every refresh of the view, including those caused
   by typing in the filter, although the statistics only depend on `series`. 400 points means 160,000 iterations per keystroke:
   a long task (over 50 ms). `computed(() => compute(series()))` is memoised: it runs again only when `series` changes.
3. **Layout thrashing.** The loop wrote `card.style.height = 'auto'` and then read `card.offsetHeight` for each card.
   Reading a layout property after a write forces the browser to flush styles and compute layout *synchronously*; doing it per
   item is one forced reflow per card (the purple "Layout" bars). The rule is: **batch all reads, then all writes**.

## The fix

```ts
afterNextRender({
  write: () => { this.chart = new FakeChart(); this.chart.init(host); this.chart.update(this.series()); },
  read: () => this.cardHeight.set(Math.max(0, ...this.cards().map((c) => c.nativeElement.offsetHeight))),
});
effect(() => { const data = this.series(); this.chart?.update(data); });
inject(DestroyRef).onDestroy(() => this.chart?.destroy());
protected readonly stats = computed(() => this.statsService.compute(this.series()));
```
```html
<div class="card" #card [style.height.px]="cardHeight()">
```

- **Render hook phases** (verified in the Angular 22 type definitions): `afterNextRender` / `afterEveryRender` accept either a
  callback or a spec object with the phases `earlyRead`, `write`, `mixedReadWrite`, `read`, which run in that order across
  *all* components, each phase receiving the previous phase's result. Put DOM writes in `write` and measurements in `read`
  so the browser lays out once. A signal set in the `read` phase drives the final write through a normal binding.
- **Trap fixed on the way:** `effect(() => this.chart?.update(this.series()))` would never re-run: while `this.chart` is
  `undefined` the optional call skips evaluating its arguments, so `series()` is never read and no dependency is registered.
  Read signals first, then use them: `const data = this.series(); this.chart?.update(data);`.
- **Choosing between `computed`, a worker and chunking** for the heavy statistics: `computed` is the first fix because it
  removes the repeated work (the cost is paid once per data change instead of once per keystroke). Measure the remaining cost
  with a Performance recording: if a single computation still exceeds ~50 ms it blocks the main thread on every data change, and
  the next step is a Web Worker (off-thread, best) or chunking the loop into slices that yield to the browser, with a progress
  state. Memoise first: it is the cheapest change with the largest effect.

## Modern Angular takeaway

- Wrapping a third-party widget: create after render, update from an effect, destroy with `DestroyRef`. Never create in an effect
  without a matching cleanup.
- No work in template method calls; `computed` for derived data.
- Batch DOM reads and writes with render hook phases; don't read layout properties in the middle of a write loop.
- To see all three in Chrome: follow the profiling guide (`GUIDE.md` in this topic).

## What a reviewer should say in the PR comment

> The effect builds and initialises a new chart on every data change and never destroys any (leaked listeners and rAF loops):
> create once in `afterNextRender`, `update()` in the effect, `destroy()` in `onDestroy`. `stats()` is an O(n^2) template method,
> so it runs on every keystroke: make it a `computed`. The height-equalising loop alternates style writes and `offsetHeight` reads
> (forced reflow per card): measure all cards in the `read` phase and apply the height with a bound signal.
