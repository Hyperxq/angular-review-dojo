# Change detection playground

Open the playground in the app (Change detection > Playground), click around, and watch the
"checked N times" counters. Every claim below is either **demonstrated by `playground.spec.ts`** (marked
[spec]), **read in the installed Angular 22.2.2 source or type definitions** (marked [src]), or taken from the
Angular documentation / general knowledge and **not verified in this repo** (marked [docs]).

The counter is a template expression that calls a method: normally a smell, here deliberate. It is the only way to
observe "this view's template was evaluated". (In dev mode every template is evaluated twice per refresh, so the
counter counts evaluations that happen in the same synchronous run once.)

## The three cards

| Card | Strategy | Data |
|------|----------|------|
| Eager | `ChangeDetectionStrategy.Eager` | plain `@Input()` and a plain field |
| OnPush (plain fields) | `ChangeDetectionStrategy.OnPush` (the default in Angular 22) | plain `@Input()` and a plain field |
| OnPush (signals) | `OnPush` | `input()` and a `signal` |

In Angular 22 `OnPush` is the default; `Eager` is the "check whenever traversal reaches me" strategy, and
`ChangeDetectionStrategy.Default` is a deprecated alias of `Eager` [src: `ChangeDetectionStrategy` enum docs].

## Experiments

| Click | What you see | Why |
|-------|--------------|-----|
| **Mutate the product object** | Only the Eager card shows the new price | Input bindings are compared by reference (`Object.is`). The reference did not change, so OnPush children are not marked dirty. The Eager card is simply refreshed because its parent was. [spec] [src: `bindingUpdated`] |
| **Replace the product object** | All three cards show the new price | A new reference changes the input binding, which marks an OnPush child for refresh. [spec] |
| **Do nothing (just an event)** | Parent and Eager counters go up, the OnPush counters do not | The click handler marks the parent view and its ancestors dirty; the parent is refreshed, and a refreshed parent also refreshes its Eager children. Clean OnPush children are skipped. [spec] |
| **Set note in setTimeout** (Eager / OnPush) | Nothing happens when the timer fires. After the next event, only the Eager card shows the note | A timer writing a plain field notifies nobody. A later refresh that reaches an Eager view shows the new value. An OnPush view is never refreshed for it. [spec] |
| **... + markForCheck** | The OnPush card now shows the note | `ChangeDetectorRef.markForCheck()` marks the view and its ancestors for refresh and tells the scheduler to run a tick. [spec] [src: `NotificationSource.MarkForCheck`] |
| **Set signal in setTimeout** | Only the signal card's counter moves; the parent's counter and the other cards' counters stay | A signal read in a template registers that view as a consumer. Writing it marks that view for refresh. Its ancestors are only flagged for *traversal*: they are visited to reach the view, but their own templates are not re-run. [spec] |

## What actually happens (trigger, schedule, refresh)

1. **Trigger.** Something tells Angular's `ChangeDetectionScheduler` that state may have changed. The internal
   `NotificationSource` enum lists them: `MarkAncestorsForTraversal` (a signal read in a template changed), `SetInput`,
   `DeferBlockStateUpdate`, `MarkForCheck`, `Listener` (a template or host event listener ran), `RootEffect`,
   `ViewEffect`, `ViewAttached`, `ViewDetachedFromDOM`, `RenderHook`, `AsyncAnimationsLoaded`, `PendingTaskRemoved`,
   `CustomElement`, `DebugApplyChanges` [src: `NotificationSource` in `@angular/core`, marked internal]. The `async` pipe
   calls `markForCheck()` itself when it receives a value [src: `@angular/common`].
2. **Schedule.** `notify(source)` sets dirty flags on `ApplicationRef` and, unless a tick is already scheduled,
   schedules `tick()`. The default scheduler waits for whichever fires first of `requestAnimationFrame` and
   `setTimeout`; right after a tick it uses a microtask instead [src: `scheduleCallbackWithRafRace`, `ChangeDetectionSchedulerImpl`].
3. **Refresh.** `ApplicationRef.tick()` runs `synchronize()`: while flags are dirty (at most 10 rounds; dev mode throws
   `NG0103` after that) it flushes root effects, refreshes the views that require it, then runs `afterRender` hooks
   [src: `ApplicationRef.tickImpl`, `synchronizeOnce`]. Refreshing a view means running its compiled template function: each
   binding computes its value, compares it to the previous value stored in the view with `Object.is`, and writes to
   the DOM node **only if it changed** [src: `bindingUpdated`]. There is no virtual DOM and no separate commit phase: the
   comparison and the DOM write happen in the same pass.
4. **Dev-mode second pass.** After `synchronize()`, dev mode runs `checkNoChanges()` on every view
   [src: `tickImpl`]. It re-evaluates the bindings in a mode where any value that differs from the one just rendered
   throws `ExpressionChangedAfterItHasBeenCheckedError` (NG0100) [src: `throwErrorIfNoChangesMode`]. That is why a getter with
   side effects, or a child writing parent state during the check, fails in dev and silently "works" in production.

## Comparison with React [docs: general knowledge, not verified here]

| | React | Angular |
|---|-------|---------|
| Trigger | `setState` / hook update | event listener, signal write, `markForCheck`, input change, ... |
| Schedule | scheduler batches | `ChangeDetectionScheduler` (rAF/timeout race, microtask after a tick) |
| Work | **render**: call the component function, get a new element tree | **refresh**: run the template update function of dirty views |
| Diff | **reconcile**: compare old and new element trees | per-binding `Object.is` comparison against the stored previous value |
| Output | **commit**: apply DOM mutations | direct DOM write during the same pass |
| Skipping | `memo` and friends, opt-in | `OnPush` (default since Angular 22) and signals, opt-out |

The practical difference: a React component re-runs *as a function* and everything it returns is diffed. An Angular component
class does not re-run; only the bindings of dirty templates are re-evaluated, and a signal can point at the exact view that
needs it.

## What marks an OnPush view dirty

- An input binding received a **different reference** [spec].
- An event listener in its own template or host fired (clicking inside the card refreshes it) [spec, see the counters].
- `markForCheck()` was called [spec], which the `async` pipe does on your behalf [src].
- A **signal read in its template** changed [spec].
- `ComponentRef.setInput` (that is what tests use) [src: `NotificationSource.SetInput`].

Nothing else does. In particular: a plain field assigned in a `setTimeout`, a promise or a third-party callback.

## zone.js versus zoneless

With zone.js, patched async APIs (timers, promises, events) tell Angular when they finish, and Angular runs a
global check afterwards. In the scheduler source, with zone.js present the refresh mode is `Global` for the
tick and the `Listener` notification is ignored (zone.js already announced the event); without it the mode is
always targeted [src: `ChangeDetectionSchedulerImpl.notify`, `ApplicationRef.synchronizeOnce`]. This repo is
zoneless and does not install zone.js, so that comparison was **read from the source, not run**: the practical
consequence for reviews is the one the playground shows, that code that "worked" because every timer used to trigger a
check stops rendering unless it writes a signal or calls `markForCheck`.

## Review rules of thumb

- Data a template reads: signals (or `async`/`toSignal`). Plain fields are fine only for values that change in
  response to an event handled by that same template.
- Never fix a missing update with `detectChanges()` sprinkled around, or by switching to `Eager`. Find out which notification
  is missing.
- Mutating an object that you pass down is a bug under OnPush, with or without signals.
