# L2 - Order summary: solution

## What was wrong

1. **The order was mutated, not replaced.** `lines.push(...)` changes the object inside the signal
   but the signal still holds the same reference, so `set`/`update` never ran and nothing was notified.
   The parent re-rendered anyway (its click handler marked it dirty) so the list looked fine, but
   `[order]="order()"` bound the same reference, so the OnPush child's input did not change and its
   view was not refreshed. Signals (and OnPush inputs) compare **by reference**.
2. **Totals computed inside the template through methods.** `subtotal(order)` was called three
   times directly, plus once more from `tax` and twice from `total`: 5 passes over the lines for each
   check of the view, and the view is checked again on any event handled by the component.
3. **State derived with `effect()`.** `itemCount` is a pure function of `order()`; copying it
   into a second signal from an effect adds a write-after-read hop (the value lags one reactive step
   behind its source and the effect needs scheduling). It is not detectable from the spec because
   the final DOM is identical: that is why it is a review item.

## The fix

```ts
this.order.update(({ lines }) => ({ lines: [...lines, line] }));
```
```ts
protected readonly totals = computed(() => {
  const order = this.order();
  const subtotal = this.math.subtotal(order);
  const tax = subtotal * OrderMath.TAX_RATE;
  return { subtotal, tax, total: subtotal + tax, itemCount: order.lines.reduce(...) };
});
```

## Modern Angular takeaway

- Immutable updates are not a style choice with signals and OnPush: they are how change is
  detected.
- Use `computed` for derived values. Reserve `effect` for side effects that leave the reactive
  graph (logging, `localStorage`, imperative APIs). An effect that only calls `set` on another
  signal is a `computed` in disguise (or a `linkedSignal` if the value must also be writable).
- If a `Pricing`-style calculation is pure, a `computed` also memoises it for free.

## What a reviewer should say in the PR comment

> `lines.push()` mutates the object held by the signal, so the OnPush summary never sees a new
> input; use `update` with a new object. Inside the summary, `itemCount` is derived state and should
> be a `computed`, not an `effect` + `set`, and the template calls `subtotal()` five times per
> check; compute the totals once in a `computed`.
