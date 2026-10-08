# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

All four symptoms come from asking the view for things at the wrong time. Order of events: constructor, first input
binding, `ngOnInit`, first template render (creating the `@if` content), `ngAfterViewInit`, `ngAfterViewChecked` after
every pass.

</details>

<details><summary>Hint 2 - area</summary>

- When `ngOnInit` runs, does the element inside `@if (showLegend)` exist? What does a non-static `@ViewChild` hold then?
  What happens when the legend appears later?
- Writing a field that the template reads from `ngAfterViewInit` of the same component: is the template refreshed afterwards?
  (See Change detection L2.)
- `ngAfterViewChecked` runs after **every** pass of this view. Should "ticks for the current width" be recomputed that
  often?
- Which Angular functions run only in the browser, after Angular has rendered, and offer separate phases for reading and
  writing the DOM?

</details>

<details><summary>Hint 3 - near the answer</summary>

`legend = viewChild<ElementRef<HTMLElement>>('legend')` and apply the attribute with a host-free approach: bind it in the
template (`[attr.aria-live]`) or react in an `effect`. Measure with `afterNextRender({ read: () => this.width.set(plot.offsetWidth) })`,
declare `ticks = computed(() => calc.ticks(this.width()))` and read signals in the template.

</details>

---

Tests won't catch one item: the server-side rendering error (symptom 4). The unit tests run in a browser-like
environment where touching the DOM works. `afterNextRender` and `afterEveryRender` only run in the browser, which is the point.
