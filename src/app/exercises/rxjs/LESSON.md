# RxJS: a lesson before the exercises

You knew this once. You wrote `async` pipes, you fought `ExpressionChangedAfterItHasBeenCheckedError`, you put
`takeUntil(this.destroy$)` in every component of a v17 app. Most of that knowledge still applies; it is buried under a few
years and a framework that moved. This lesson digs it back up, one chapter per exercise, in the same order.

How to use it:

- Read chapter 0 once, and come back to its operator reference whenever a chapter mentions an operator. The reference says
  what each operator does; the chapters are about how to reason, and never tell you which operator a situation needs.
- Read one chapter, then do its exercise. Do not read ahead: each chapter assumes the previous exercise is done.
- The examples use a different domain (a library: books, members, loans) and, on purpose, different problems from the
  exercises. Recognising the exercise's case is your part.
- Every chapter ends with review questions. Ask them out loud while reading the exercise code. A reviewer who asks the right
  question finds the bug; one who scans for familiar shapes usually misses it.

## Chapter 0: what moved since Angular 17

Before RxJS itself, recalibrate the ground it runs on. Four changes matter for every exercise, and a reference of the
operators the chapters use follows them.

### Zone.js is gone

In v17, Zone.js patched `setTimeout`, `addEventListener`, `XMLHttpRequest` and every other async API. When one of those
callbacks finished, Zone told Angular that something might have changed, and change detection ran over the tree. A lot of
v17 code depended on that without its authors knowing it.

This app is zoneless: `zone.js` is not even installed, and since v21 that is Angular's default, with no provider to
configure. Nobody patches the browser anymore. Angular schedules change detection when something it understands tells it
to. The common triggers are:

- a signal read by a template changes,
- a template or host event listener runs,
- an `async` pipe receives a value,
- someone calls `markForCheck()`.

There are a few more (`ComponentRef.setInput`, attaching a view that is marked dirty), and an OnPush child receives new
input references during its parent's check. A change that reaches none of these schedules nothing. When you read code, ask
which mechanism tells Angular about each change.

### OnPush is the default

In v22 `ChangeDetectionStrategy.OnPush` is the default; the old behaviour is now called `Eager` (`Default` is a deprecated
alias). OnPush means "check me only when my inputs change by reference, when an event happens inside me, or when a signal I
read changes". You will meet two consequences again:

- mutating an object in place is invisible, because the reference stays the same;
- reactive state (signals) is the normal way to tell Angular that something changed.

### Signals are the state primitive

```ts
const count = signal(0);              // writable state
const double = computed(() => count() * 2); // derived, lazy, memoized
effect(() => console.log(count()));   // side effect that re-runs when what it read changes
```

A signal holds a current value. An observable describes events over time. Every decision in this lesson comes back to that
difference: keep values in signals, keep things that happen (clicks, keystrokes, server pushes, polling) in observables, and
cross the border on purpose.

### The bridge: `@angular/core/rxjs-interop`

| API | What it does |
|-----|--------------|
| `toSignal(obs$)` | Subscribes now, exposes the latest value as a signal, unsubscribes when the owner is destroyed. |
| `toObservable(sig)` | Emits the signal's value whenever it changes (asynchronously, after the change settles). |
| `takeUntilDestroyed()` | Completes a stream when the current component/service/injector is destroyed. Replaces the old `destroy$` subject. |
| `rxResource({ params, stream })` | Async state driven by signals: re-runs `stream` when `params` changes and cancels the previous run. |

For plain GET reads driven by signals, `httpResource(() => url)` from `@angular/common/http` does the same job without an
observable in sight.

> [!NOTE]
> `toSignal` and `takeUntilDestroyed()` without arguments have rules about where they may be called. Chapter 6 covers
> them.

### Operator reference

What each operator does, on abstract values. Nothing here is tied to an exercise.

Flattening operators map each outer value to an inner observable. In the four diagrams below, the outer stream emits `a` at
frame 0 and `b` at frame 3, and each inner observable emits its capital letter five frames after it starts, then
completes.

`switchMap`: a new outer value unsubscribes the running inner one.

```marbles
outer:      a--b------------
inner a:    ---x                 // unsubscribed at frame 3
inner b:       -----B|
result:     --------B-------
```

`mergeMap`: every inner runs; results come in arrival order. `mergeMap(fn, n)` runs at most `n` inners at a time.

```marbles
outer:      a--b------------
inner a:    -----A|
inner b:       -----B|
result:     -----A--B-------
```

`concatMap`: the next inner starts when the previous one completes. Waiting outer values are buffered, with no upper bound.

```marbles
outer:      a--b------------
inner a:    -----A|
inner b:          -----B|        // starts when inner a completes
result:     -----A-----B----
```

`exhaustMap`: while an inner runs, new outer values are ignored.

```marbles
outer:      a--b------------     // b is ignored
inner a:    -----A|
result:     -----A----------
```

`forkJoin`: waits until every input completes, then emits their last values once (`p` is the pair `[2, 3]`).

```marbles
a$:         --1--2|
b$:         ---3|
result:     ------p|
```

`combineLatest` emits whenever any input emits, once all have emitted. `a$.pipe(withLatestFrom(b$))` emits only when `a$`
does, and only after `b$` has a value (`p`, `q`, `r` are the pairs).

```marbles
a$:               -a-----b------
b$:               ---1-----2----
combineLatest:    ---p---q-r----
withLatestFrom:   -------q------
```

Rate operators, each with a duration of three frames:

```marbles
input:      abc-------def--------
debounce:   -----c---------f-----   // debounceTime: the last value after 3 quiet frames
audit:      ---c---------f-------   // auditTime: the latest value 3 frames after a window's first value
throttle:   a---------d----------   // throttleTime: the first value, then silence for 3 frames
```

`shareReplay` shares one subscription to the source and replays the latest value. Its `refCount` option decides what
happens when the subscriber count drops to zero. Here the source emits every three frames, subscriber 1 leaves at frame 5,
and subscriber 2 arrives at frame 8.

With `refCount: false` (the default) the source subscription stays alive, and the buffer with it:

```marbles
source:          a--b--c--d--e--   // one subscription, kept after subscriber 1 left
subscriber 1:    a--b-x
subscriber 2:            cd--e--   // gets the buffered c at once, then d
```

With `refCount: true` the source is unsubscribed at zero subscribers and started again for the next one:

```marbles
source run 1:    a--b-x            // unsubscribed when subscriber 1 left
subscriber 1:    a--b-x
source run 2:            a--b--c   // a new run for subscriber 2
subscriber 2:            a--b--c
```

`catchError` replaces an error with another observable; `retry` resubscribes to the source; `takeUntil` completes when a
notifier emits:

```marbles
source:       a--b--#
catchError:   a--b--f|             // f comes from the replacement observable
```

```marbles
attempt 1:    a--#
attempt 2:       a--b|             // retry(1): a second subscription
result:       a--a--b|
```

```marbles
source:       a--b--c--d--
notifier:     -------n----
takeUntil:    a--b--c|
```

`retry` takes a config: `count` (how many attempts), `delay` (a function of the error and the attempt number that returns an
observable; the retry happens when it emits) and `resetOnSuccess` (reset the attempt counter when a retried subscription
emits a value).

## Chapter 1: a subscription has a lifetime (exercise 01)

### The problem

Leaks in a single-page app do not crash anything. They make long sessions worse: the staff at a library desk keep the same
tab open from opening to closing time, and by the afternoon the app is slower than it was in the morning. In a heap
snapshot you find components that left the screen hours ago still in memory, with their DOM nodes detached but retained.
The cause is almost always a subscription that nobody owns: it started, and nothing in the code is responsible for ending
it.

### The mental model

An observable is a function that has not run yet. Calling `subscribe` runs it and gives you back a `Subscription`, the handle
that stops it. Some of those functions finish on their own; others run until someone calls the handle.

```marbles
http.get:   -----r|                    // one value, then it completes on its own
interval:   ---0---1---2---3---4---5--  // never completes: someone has to unsubscribe
```

For every subscription there are two lifetimes to compare: the source's and the subscriber's. When the source lives longer
(an event target like `window` or `document`, a `Subject` in a root service, a timer), the subscription keeps the subscriber
alive and keeps calling it after the screen it belonged to is gone.

### Pick the smallest tool

The circulation desk shows a banner when the browser goes offline. Listening on `window` from a component is a classic leak,
and Angular's host listeners handle it with no stream at all:

```ts
@Component({
  selector: 'app-connection-banner',
  host: {
    '(window:online)': 'online.set(true)',
    '(window:offline)': 'online.set(false)',
  },
  template: `@if (!online()) { <p role="status">You are offline. Changes will not be saved.</p> }`,
})
export class ConnectionBanner {
  protected readonly online = signal(navigator.onLine);
}
```

Host listeners accept global targets (`window:`, `document:`, `body:`), and Angular removes them when the component is
destroyed. Reach for a stream when you need operators on the events, and give the stream an owner:

```ts
constructor() {
  fromEvent(window, 'resize')
    .pipe(
      auditTime(100),       // at most one layout pass per 100 ms
      takeUntilDestroyed(), // ends with this component, not with the window
    )
    .subscribe(() => this.layoutShelves());
}
```

### When not to use them

- A source that ends by itself does not leak, but it can still outlive its screen: a component destroyed while its HTTP
  request is in flight still runs the callback when the response arrives, against a view that is gone. Owning the request
  (through the framework's interop or a resource) also cancels it.
- Do not turn an event stream into a signal when you care about every event. A signal keeps only the latest value, so two
  events in the same tick collapse into one.

### Review questions

- For each subscription, which lives longer: the source or the code that subscribed? What ends the longer one?
- If this component were created and destroyed a hundred times, what would be left behind?
- When a value arrives, which mechanism from chapter 0 tells Angular about it?

**Now do exercise 01.**

## Chapter 2: races (exercise 02)

### The problem

A race does not throw, does not log, and passes every test that runs on a fast machine. Developers rarely see one, because
their network is fast and their data is small. The people who see them are on slow connections and busy screens, and what
they see is plausible: correct-looking data that belongs to something else. They have no reason to doubt it, which is what
makes races expensive.

### The mental model

Every request is a promise about the moment it was made. When requests overlap, they come back in whatever order the network
decides, not in the order they were sent. Code that applies every response as it arrives shows whichever one arrived last.

A member list shows a preview card with the loan count of the name under the pointer:

```ts
onHover(memberId: number): void {
  this.api.loanCount(memberId).subscribe((count) => this.preview.set({ memberId, count }));
}
```

Moving the pointer over members 1, 2 and 3 starts three requests:

```marbles
hover$:     1--2--3-------------
count 1:    --------------a|          // the slowest answer arrives last
count 2:       --------b|
count 3:          ---c|
preview:    ---------c-b--a-----      // ends on member 1, under the pointer at member 3
```

Nothing in this code knows that the request for member 1 became irrelevant at frame 3.

### The rule

Two rules cover most of this chapter:

1. Work started for something the user no longer looks at must stop, or at least must not reach the screen.
2. Sequence only what depends. A step that does not need another step's result should not wait for it, and a step that
   does need it should not start before it.

The operator reference in chapter 0 shows which operators unsubscribe, which run side by side, and which wait. Picking
among them is the exercise.

### When not to cancel

- Writes. Cancelling a request on the client does not cancel it on the server (chapter 3).
- Work that will be reused: a prefetch whose result goes into a cache is still useful after the user moves on.
- Fire-and-forget reporting (analytics, logging), which should finish whatever the user does.

### Review questions

- When the thing the user is looking at changes, what happens to work still running for the old one?
- If the responses came back in the reverse order of the requests, what would the user see?
- On any screen: which path of requests is the slowest, and which steps on it could start earlier?

**Now do exercise 02.**

## Chapter 3: the flattening operator is a business decision (exercise 03)

### The problem

Four flattening operators have the same signature and compile in the same places. Choosing among them looks like a
technical detail, and it is a product decision: what should happen when a person, a device or a timer produces a second event
before the first one has been handled? Demos rarely produce overlapping events, so the decision is usually made by
accident.

### Four answers to one question

Every flattening operator answers the same question: an inner operation is running and a new outer event arrives, so what
now? Each answer fits a different rule:

| Operator | Answer | Library case |
|----------|--------|--------------|
| `switchMap` | Cancel the old one, start the new one. | The floor plan view: the member picked floor 3, so floor 2's plan no longer matters. |
| `mergeMap` | Run them side by side, emit results as they come. | Prefetching the covers of the next page of results, at most four at a time. |
| `concatMap` | Queue the new one until the old one completes. | Autosaving a review draft: every save must land, in order, so the server ends on the latest text. |
| `exhaustMap` | Ignore the new one while the old one runs. | Resyncing loans when the connection comes back: if the network flaps and reports "online" again during a resync, the running resync already covers it. |

To choose, say the business rule out loud for the overlap case ("if a second save starts while one is running, ...") and
pick the operator whose answer matches the sentence. Then check the costs that come with it: `concatMap` buffers waiting
values with no upper bound, so a fast source and a slow inner observable build a growing queue; `mergeMap` without a
concurrency limit starts as many inners as there are events.

### Shaping events before they become work

Humans and hardware produce more events than the work needs. A slider that sets a member's reading progress fires dozens of
values per drag; only the last one should be saved. `debounceTime(ms)` lets a value through only after `ms` without a newer
one. Here it waits three frames:

```marbles
slider:    a-b-c-d---------e-------
save:      ---------d---------e----
```

The reference in chapter 0 shows its relatives. `throttleTime` keeps the first value of a burst; `auditTime` emits the
latest value a fixed time after the first value of each window, which suits layout work on `resize`.
`distinctUntilChanged()` drops a value equal to the previous one.

### When not to use them

- Debouncing adds latency to every value. Where the first value matters (feedback on a press), keep the first, not the last.
- `distinctUntilChanged()` compares with `===`. On objects it only drops the same reference; pass a comparator
  (`distinctUntilChanged((a, b) => a.id === b.id)`) when equal content should count as equal.

### Review questions

- Say the business rule for the case where a second event arrives while the first is still being handled. Which operator says
  the same thing?
- What changes if the user double-clicks, or if the network is ten times slower?
- How many units of work does one human action produce, and what does each cost?

**Now do exercise 03.**

## Chapter 4: an error is the end of the stream (exercise 04)

### The problem

People who learned error handling with `try`/`catch` expect execution to continue after the catch block. Streams do not
work that way, and the difference bites hardest in long-lived streams: live feeds, background syncs, anything a screen
depends on for longer than one request. Whoever relies on such a stream (the staff at a returns desk, a member watching a
hold queue) depends on code paths that run once a month, in the worst conditions.

### The contract

An observable may emit any number of `next` values, then at most one `error` or `complete`. After either, it is finished for
good: no more values, and every operator in the chain unsubscribes from its source.

The returns desk shows a feed of books coming back, pushed over a WebSocket:

```ts
readonly returns$ = this.socket.messages$.pipe(
  map((raw) => parseReturn(raw)), // throws on a malformed message
);
```

```marbles
messages$:  a--b--z--c--d--     // z is malformed
returns$:   a--b--#            // the throw becomes an error; the feed is over
```

One bad message should end the processing of that message, not the feed. The plainest fix here is to stop treating a bad
message as an exception: let the parser return a value that says "not a return" and filter it out.

```ts
readonly returns$ = this.socket.messages$.pipe(
  map((raw) => tryParseReturn(raw)), // returns undefined for a malformed message
  filter((entry) => entry !== undefined),
);
```

```marbles
messages$:  a--b--z--c--d--
returns$:   a--b-----c--d--    // z was dropped; the feed goes on
```

For every error, ask which stream it travels through. Follow it from where it is thrown, operator by operator, until
something handles it, and list every subscription it ends on the way.

### Retrying

`retry` resubscribes to everything above it in the pipe when an error arrives. For the feed, a dropped connection is worth
retrying. Wait between attempts, and let the wait grow with each failure (exponential backoff), with a ceiling, so a server
that is struggling is not hit in a tight loop by every open tab.

A feed that should retry forever has one more trap. The attempt counter counts every failure since the subscription
started, so after a few short outages over a day, the delay is already at its ceiling (or the `count` is used up) when a
new outage begins. `resetOnSuccess: true` resets the counter once a retried subscription emits a value again.

> [!WARNING]
> `retry` resubscribes to every source above it. Before adding it, ask what resubscribing does to each of those
> sources, not only to the one that failed.

### When not to use them

- Do not retry errors that will repeat. A malformed message, a `404` or a validation error give the same answer every time.
- Do not retry writes without knowing what the server does with a duplicate (the HTTP track covers this).
- Do not reach for `catchError` to make an error disappear. Replacing a failure with a value is only right when the value is
  true; otherwise the user believes something false.

### Review questions

- For each operator that can throw and each request that can fail: which stream does the error end? Is that the stream you
  want to end?
- After the failure, what does the user see, and what has to happen before the feature works again?
- For each retry: what does one attempt cost, and can a second attempt succeed for this kind of failure?

**Now do exercise 04.**

## Chapter 5: cold, hot, and shared (exercise 05)

### The problem

The cost of a stream is mostly invisible in the file that creates it. The server team pays for work nobody asked for, the
member's device pays in battery and data, and users act on whatever the screen hands them. How often a producer runs, and
what it gives to whoever subscribes later, is decided by a few characters in a pipe that rarely look important at the call
site.

### Cold observables run once per subscriber

An observable is a function that has not run yet (chapter 1). Subscribe twice and it runs twice. That is a cold observable.
The library's queue ticket makes the effect obvious:

```ts
const ticket$ = defer(() => of(nextTicketNumber()));
```

```marbles
widget 1:   a|
widget 2:   b|          // a second run of the producer: a different number
```

Two widgets subscribed to `ticket$` show two different numbers. Replace `nextTicketNumber()` with an HTTP call and you get
two requests that may also return different answers. Every `async` pipe and every `toSignal` is a subscriber; count them.

### Subjects: which one remembers?

A Subject is both an observable and the thing you push values into. Subjects differ in what a late subscriber receives:

| Type | Late subscriber receives | Fits |
|------|--------------------------|------|
| `Subject` | Nothing from the past. | Events: "a hold became available". |
| `BehaviorSubject(initial)` | The current value at once, then future ones. | Current state, when you cannot use a signal. |
| `ReplaySubject(n)` | The last `n` values, then future ones. | Short histories, used deliberately. |

The notification channel is an event stream. A panel that opens later should see new notifications, not old ones:

```marbles
toasts$:            a-----b---------
panel (Subject):        --b---------      // opened at frame 4: only what happens next
panel (Replay):         a-b---------      // the same panel shows an old toast again
```

### Sharing a source between subscribers

`share()` and `shareReplay()` make one subscription to the source and multicast it; `shareReplay` also keeps the latest
values for latecomers. The two `refCount` diagrams in chapter 0 show the choice that matters: when the last subscriber
leaves, does the source keep running or stop?

Neither behaviour is the safe default. Take two sources from the library app, the list of branches (loaded once, small,
the same all day) and a position watch for the branch map (`navigator.geolocation.watchPosition` wrapped in an observable).
Before reading on, decide which diagram each one wants, and why.

> [!TIP]
> Decide by asking what the source costs while nobody is watching, and what a subscriber who arrives later should receive.

### When not to use them

- Do not share an observable whose subscribers need independent runs (a "generate a new code" action).
- Do not use `BehaviorSubject` for events: every new subscriber handles the last event again (a dialog opens twice).
- Do not add `shareReplay` "for performance" to a source with one subscriber; it only adds a lifetime question.

### Review questions

- How many times does each producer run? Count every subscriber, including template pipes and signals made from it.
- When someone subscribes late, what should they see: nothing, the latest value, or a history?
- When the last subscriber leaves, what does the source still cost, and who pays for it?

**Now do exercise 05.**

## Chapter 6: injection context, and the job of an effect (exercise 06)

### The problem

`NG0203` ("can only be used within an injection context") tends to appear after a refactor, in code that worked the day
before: someone moved a line into a callback. The opposite failure is quieter: an `effect` that keeps two pieces of state in
sync works until the day the order of updates changes, and then the screen shows a combination that should not exist.

### Injection context

`inject()` only works while Angular is constructing something: field initializers, the constructor, a provider factory, or a
function run inside `runInInjectionContext`. Every function built on `inject()` inherits that rule, including your own
helpers:

```ts
export function injectBranchId(): Signal<number> {
  return inject(BranchContext).id;
}

export class ShelfMap {
  readonly branchId = injectBranchId(); // fine: a field initializer

  async openDetails(): Promise<void> {
    await this.dialog.closed();
    const id = injectBranchId();        // NG0203: construction ended long ago
  }
}
```

Several APIs that clean up after themselves (`toSignal`, `takeUntilDestroyed()` without arguments, `effect`) use the same
mechanism to find their owner, so they follow the same rule. In order of preference, the ways out are:

1. Do the work at construction and keep the result, then read it later.
2. Use the API's explicit form, if it has one: many of these APIs accept an owner (an injector or a destroy reference) as
   an argument, so they no longer need to find one.
3. `runInInjectionContext(injector, () => ...)` for the rare case that really needs a context later.

### `effect` is for leaving the signal graph

An `effect` exists to push signal state out to something that is not a signal: `localStorage`, `document.title`, a chart
library, a logger. A common misuse keeps one signal in step with another:

```ts
readonly shelf = signal<Shelf>(firstShelf);
readonly page = signal(1);

constructor() {
  effect(() => {
    this.shelf();      // when the shelf changes...
    this.page.set(1);  // ...go back to the first page
  });
}
```

Between the shelf change and the effect run, there is a moment where the new shelf and the old page coexist, and anything
reading both sees it. `linkedSignal` says the same thing as a derivation, with no gap: a writable signal that resets
whenever its source changes.

```ts
readonly page = linkedSignal({ source: this.shelf, computation: () => 1 });
```

> [!IMPORTANT]
> To derive state, use `computed` (or `linkedSignal` when the result must also be writable). To load state, use a resource.
> An `effect` that writes to another signal is a sign that one of those was the better tool.

### When not to use them

- Do not reach for `runInInjectionContext` as a reflex. Usually the call belongs in a field initializer.
- Do not avoid `effect` where it fits: syncing to `localStorage` or to a third-party widget is exactly its job.

### Review questions

- For every call to `inject()` or a function built on it: is it guaranteed to run during construction? Would it still be if
  someone moved it into a callback next month?
- For every `effect`: what non-signal thing does it write to? If the answer is another signal, what would `computed` or
  `linkedSignal` look like?
- When an effect runs again, is anything from its previous run still running?

**Now do exercise 06.**

## Chapter 7: combination semantics and writing your own operator (exercise 07)

### The problem

Every combination of streams makes a claim about time: these values belong together at this moment. When the claim is
wrong, the screen shows pairs that never existed together, and each frame looks plausible on its own. Bugs of this kind
survive screenshots and code review alike, and reach production as "it glitches sometimes". The other half of this chapter
is about operators you write yourself, where a small slip makes a stream impossible to stop.

### What each combinator waits for

`combineLatest`, `withLatestFrom` and `zip` differ in two things: which inputs can trigger an emission, and what they wait
for before the first one (chapter 0 has the diagrams). `zip` pairs values by index, which is rarely what UI code means.

`combineLatest` waits until every input has emitted once. The overdue dashboard combines the member list with an
`overdue$` stream that only pushes on changes:

```marbles
members$:   m-------------------
overdue$:   ---------o----------   // first push comes when something changes
view:       ---------v----------   // blank until frame 9
```

Give the slow input a starting value (`startWith`) or hold it in a signal, which always has one.

### Combining a source with something derived from it

The catalogue search shows "Results for <term>" above the list. The heading reads the term, the list reads the results, and
the results are derived from the term through a request:

```ts
const results$ = term$.pipe(switchMap((term) => this.api.search(term)));
combineLatest([term$, results$]).pipe(map(([term, results]) => ({ term, results })));
```

```marbles
term$:      a--------b--------
results$:   ---A--------B-----     // each search answers three frames later
view:       ---1-----2--3-----     // what does the screen show at frame 9?
```

Signals have a related guarantee: a `computed` reads all its inputs at the moment it is evaluated, so a purely synchronous
derivation never sees half an update. An asynchronous step, like the request here, is outside that guarantee.

### Writing an operator

An operator is a function from observable to observable. The safest way to write one is to compose existing operators.
When you write one by hand with `new Observable`, check it against the contract every consumer relies on:

- each source value either goes out (perhaps transformed) or is dropped on purpose;
- an error from the source reaches the consumer;
- completion of the source reaches the consumer;
- when the consumer unsubscribes, everything the operator created or subscribed to stops.

Do not check the contract by reading; test it. `TestScheduler` from `rxjs/testing` runs marbles in virtual time, and
`expectSubscriptions` checks when the operator subscribed to its source and when it let go. In subscription marbles, `^` is
the moment of subscription and `!` the moment of unsubscription:

```ts
import { TestScheduler } from 'rxjs/testing';

it('lets go of its source when the consumer unsubscribes', () => {
  const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

  scheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('a-b-c-d-|');
    const consumer = '^--!'; // the consumer leaves at frame 3

    expectObservable(source.pipe(myOperator()), consumer).toBe('a-b');
    expectSubscriptions(source.subscriptions).toBe('^--!');
  });
});
```

Write one test per line of the checklist: an error marble (`#`) in the source should appear in the output, a `|` should
appear in the output, and the subscription test above covers teardown. This example assumes an operator that passes values
through unchanged; adjust the expected output to yours.

### When not to write one

- When existing operators express it. Composition is easier to read and has already been tested; be aware, though, that a
  composed version can change completion timing (an inner timer can delay completion past the source's).
- When the "operator" is only used once. A named `pipe` of existing operators reads better.

### Review questions

- For each combined stream: what event in the real world does each emission correspond to? Is there an emission that
  corresponds to none?
- Can two inputs change because of the same underlying event, or can one lag behind the other? Could the combination ever
  pair values that never existed together?
- In a hand-written operator: list everything it creates or subscribes to. What stops each of those, and is there a test
  that proves it?

**Now do exercise 07.**

## Chapter 8: state streams and lifetimes (exercise 08)

### The problem

Client state is a copy of server state, and every copy drifts. The member trusts the screen; the desk staff trust the
screen when the member brings it to them; the server is the only one that knows what happened. When screen and server
disagree, people stop trusting the screen, and nobody can say when the disagreement started. The last exercise has no new
operator: it tests whether the previous chapters became habits.

### The reference rule

Everything that compares references (OnPush inputs, `distinctUntilChanged`, signals, which use `Object.is` by default) only
notices a change when it gets a new object. Mutating and returning the same object is invisible:

```ts
this.readingList.update((list) => {
  list.push(book);
  return list;               // same array: nothing downstream notices
});

this.readingList.update((list) => [...list, book]); // new array: everyone notices
```

The same rule holds for a `scan` reducer, a store's update function, or any other place that produces the next state from
the previous one.

### Every response has a date

A member writes a book review, and the draft is autosaved. Each save answers with the saved draft. If the code writes that
answer back into the text box, the member loses whatever they typed while the save was in flight:

```marbles
draft:      a---b---c---------      // the member keeps typing
save b:         ------b|            // saves the text as it was at frame 4
textbox:    a---b---c-b-------      // the echo of b overwrites c
```

Two questions help here. Who owns each field? The member owns the text, so a response should only update what the server
owns, such as a "saved at" time. And what moment does the response describe? It left the server at one moment and arrives
at a later one; anything that changed in between is something the response does not know about.

### Optimistic updates

Reordering a reading list by drag and drop should feel instant, so the UI updates first and tells the server after. That
choice comes with a second one that has to be made at the same time: what does the screen show, and what does the member
read, if the server says no?

### Every infinite stream needs an end

An infinite stream started in a service lives as long as the service. Ask what that is:

- `takeUntilDestroyed()` ties a stream to the injector that created it.
- A shared source with `refCount: true` stops when nobody is watching (chapter 0).

> [!WARNING]
> In a `providedIn: 'root'` service, the injector behind `takeUntilDestroyed()` is the whole app, so "destroyed" means
> "never" in practice. A component-provided service dies with its component. A route's injector outlives navigation unless
> the router is configured with `withAutoCleanupInjectors()`.

### When not to use them

- Do not build a stream-based store (`scan`, `shareReplay`) for state a signal and two methods can hold.
- Do not update optimistically when failures are common or costly (a payment). Show a pending state instead.

### Review questions

- For every state change: is a new object created, or an old one changed in place? Who compares references downstream?
- For every response written into state: what moment does it describe, and what could the user have changed since?
- For every optimistic change: what does the user see if the server says no?
- For every infinite stream: what is the shortest lifetime that still works, and what ties the stream to it?

**Now do exercise 08.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write, in
two sentences, the PR comment you would leave for the author. If you cannot write it without looking, reread the chapter:
the concept is not yours yet.
