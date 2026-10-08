# S1 - Cart service: solution

## What was wrong

**The behavioural bug: state mutated in place.** `add()` took the array out of the
`BehaviorSubject`, changed it (`line.quantity += 1`, `items.push(...)`) and emitted the *same
array* again. `CartLines` is a presentational `OnPush` component with a signal input: when the
parent passes the same reference, the input does not change, so the child is never refreshed.
The count and the total are recomputed by `map` from the mutated array on every emission, so they
looked right. That is why only the list was stale.

**The smells that made it possible**

- A `BehaviorSubject` + `asObservable()` store: lots of ceremony for "a value I can read and
  update".
- `combineLatest([subtotal$, discountRate$])` where both inputs derive from the same source: on every
  change it first emits an inconsistent total (new subtotal with the old discount) and then the
  right one. Harmless for a template that only shows the last value, but any subscriber that
  reads it synchronously (analytics, a checkout) can see the glitch.
- Mixing `| async` and `toSignal` in the same template.

## The fix

```ts
private readonly state = signal<CartItem[]>([]);
readonly items = this.state.asReadonly();
readonly count = computed(() => this.state().reduce((n, i) => n + i.quantity, 0));
readonly total = computed(() => { ... });

add(product: Product) {
  this.state.update((items) => /* new array, new objects */);
}
```

- `signal()` + `asReadonly()` replaces the Subject/`asObservable()` pair, and consumers get a
  value they can read synchronously.
- `computed()` replaces `combineLatest`: it is lazy, memoised and **glitch-free** (it only
  recomputes after all its dependencies settle).
- `update()` with a new array and new line objects gives every consumer a new reference.

## Modern Angular takeaway

- State shared between components and read by templates: a signal in a service. Keep RxJS for
  events and async flows.
- Signals use `Object.is` by default: mutating an array or object in place is not a change.
  Always replace (`[...items]`, `{...item}`) or provide a custom `equal` on purpose.
- With container/presentational components and signal inputs this bug is easy to introduce and
  hard to see: the container is fine, the child is stale.

## What a reviewer should say in the PR comment

> `add()` mutates the array held by the `BehaviorSubject` and re-emits the same reference, so
> `OnPush` children receiving it through an input never update (the count and total only look fine
> because they are recomputed with `map`). Please make the update immutable. While we are here, a
> `signal` + `computed` store replaces the Subject, `asObservable()` and the `combineLatest` of
> two projections of the same source, and removes the intermediate-total glitch.
