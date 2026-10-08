# L1 - Order lines: solution

## What was wrong

1. **The parent mutated its array** (`push`, `splice`). The array reference never changed, so the
   `[lines]` binding of the OnPush children saw "no change" and their views were not refreshed. The parent itself was
   refreshed (the click is an event in its template), which is why nothing looked broken *there*.
2. **The list mutated its own input** (`line.quantity = ...`). An input is owned by the parent; changing it
   from below hides the change from everybody else (the summary kept the old numbers).
3. **`cdr.detectChanges()` as a patch.** It makes the one component that calls it render again, which hid problem 2 in
   the row, and it did nothing for the summary. It is also a synchronous re-render in the middle of an event
   handler, and it papers over a data-flow bug instead of fixing it. Whenever a review shows `detectChanges()`
   or `markForCheck()` next to a mutation, ask why the state is not a signal.

## The fix

```ts
protected readonly lines = signal<OrderLine[]>([...]);
this.lines.update((lines) => [...lines, newLine]);
this.lines.update((lines) => lines.filter((_, i) => i !== index));
this.lines.update((lines) => lines.map((l, i) => (i === index ? { ...l, quantity } : l)));
```
```ts
readonly lines = input.required<OrderLine[]>();
readonly quantityChanged = output<{ index: number; delta: number }>();   // children ask, the owner changes
```

The summary derives its numbers with `computed`, and `ChangeDetectorRef` is gone.

## Modern Angular takeaway

- With OnPush (the default in Angular 22), **a new reference is a notification**. Update immutably, or hold state in
  signals so that reads in templates subscribe the view for you.
- "Data down, events up": inputs are read-only for the child.
- `detectChanges()` is for tests and for rare imperative cases, not for fixing stale templates.

## What a reviewer should say in the PR comment

> `lines` is mutated in place (`push`/`splice`/`quantity =`), so the OnPush children never see a new input, and the
> `detectChanges()` in `LineList` only hides it for one component. Keep the order in a signal, update it immutably, let the
> list emit changes instead of editing its input, and remove the `ChangeDetectorRef`.
