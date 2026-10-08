# L3 - Live quote: solution

## What was wrong

Code written for zone.js leans on a safety net that no longer exists: after any timer, event or callback, zone.js told
Angular to check everything. Without it, nothing tells a view that a plain field changed.

1. **Plain fields written from a socket callback and a `setTimeout`** (`quote`, `history`, `status`). No
   signal changed, no listener ran, nobody called `markForCheck`: no refresh was scheduled. The "click anywhere" symptom is
   the click's own event notification refreshing the view.
2. **`NgZone.run` / `runOutsideAngular` leftovers.** In a zoneless app `NgZone` is a no-op implementation (`NoopNgZone`): `run`
   just calls the function. They are noise that suggests a mechanism that is not there.
3. **`ChangeDetectionStrategy.Default` (an alias of `Eager`) on the component and on the child.** Hides bugs and gives a false
   sense of safety: `Eager` only means "refresh me when traversal reaches me"; here the parent was never refreshed.
   On the child it also masked the mutation of `history` (`push`): an OnPush child would never see it.
4. **Work in `ngDoCheck`.** It runs whenever the *parent* is checked, not when the data changes, and it assigns a field that
   the template reads (the stale-then-fresh pattern of L2). A derived value is a `computed`.
5. **Nothing cleaned up.** The socket handler stayed registered forever (heap retained every old widget), and the
   timer was not cleared.

## The fix

```ts
protected readonly quote = signal<Quote | null>(null);
protected readonly history = signal<number[]>([]);
protected readonly status = signal('connecting');
protected readonly spread = computed(() => { const q = this.quote(); return q ? round(q.ask - q.bid) : 0; });

constructor() {
  this.socket.onMessage((quote) => {
    this.quote.set(quote);
    this.history.update((prices) => [...prices, quote.price]);   // new array
  });
  this.socket.connect();
  const liveTimer = setTimeout(() => this.status.set('live'), 300);
  inject(DestroyRef).onDestroy(() => { clearTimeout(liveTimer); this.socket.close(); });
}
```
The child takes `items = input.required<number[]>()` and uses the default `OnPush` strategy.

## Zoneless migration checklist (from this exercise)

- Anything a template reads and that changes outside an event handler of that template: signal.
- Third-party callbacks, timers, `WebSocket`, `postMessage`: write a signal inside the callback. No zone calls.
- Remove explicit `Default`/`Eager` markers and `ngDoCheck`; fix the underlying mutation instead.
- Pair every subscription/listener/timer with `DestroyRef.onDestroy`.
- This repo's `app.config.ts` has no zone provider and no zone.js polyfill: the app is zoneless by default. In Angular 22
  `provideZonelessChangeDetection()` still exists, and logs the dev-mode warning NG0914 if zone.js is also loaded.

## What a reviewer should say in the PR comment

> This widget only worked because zone.js re-checked everything after each callback. The values the template reads are plain
> fields assigned from a socket callback and `setTimeout`; make them signals (and `spread` a `computed`), drop the `NgZone`
> calls, the `Default` strategies and `ngDoCheck`, update `history` immutably, and close the socket and clear the timer in
> `DestroyRef.onDestroy`.
