# RxJS to signals: a lesson before the exercises

In v17 you already had `signal`, `computed` and `effect`, and you probably used them for a counter or two while the real
state of the app still lived in `BehaviorSubject`s and `async` pipes. Since then signals have spread into inputs, queries,
routing and data loading, and most code a reviewer sees now mixes both worlds. This lesson is about that border: which side
a piece of state belongs on, how to cross it, and what breaks when it is crossed in the wrong place.

How to use it:

- Read one chapter, then do its exercise. Each chapter assumes you did the previous one.
- The examples use a library (books, members, loans, shelves) on purpose, and they solve different problems from the
  exercises. The lesson gives you the tools; the exercise makes you find where they are missing.
- Each chapter ends with review questions. Ask them while you read the exercise code, before you run anything.

---

## Chapter 0: what moved since Angular 17

### The ground under every exercise

Two defaults changed, and they change how every snippet below behaves.

- This app is zoneless. `zone.js` is not installed, and since v21 that is Angular's default. Nothing patches timers or
  callbacks anymore, so Angular renders when a signal read by a template changes, when a template event handler runs, when an
  `async` pipe receives a value, or when someone calls `markForCheck()`.
- `OnPush` is the default change detection strategy in v22. The old behaviour is called `ChangeDetectionStrategy.Eager`;
  `Default` is a deprecated alias of it. An OnPush view is checked when an input receives a new reference, when an event
  fires inside it, or when a signal it reads changes.

### The signal toolbox, then and now

| You had in v17.0 | Arrived as developer preview | Status in v22.2 |
|------------------|------------------------------|-----------------|
| `signal`, `computed`, `effect` | `linkedSignal` (v19) | all stable; `linkedSignal` is writable state that resets when a source changes |
| `@Input()` + `ngOnChanges` | `input()`, `input.required()` (17.1), `model()` (17.2) | stable; inputs are signals, so `computed` can depend on them |
| `@ViewChild`, `@ContentChild` | `viewChild()`, `viewChildren()`, `contentChild()` (17.2) | stable; queries are signals |
| `@Output()` + `EventEmitter` | `output()` (17.3) | stable; an event emitter with no RxJS inside |
| `toSignal`, `toObservable` (developer preview) | | stable, in `@angular/core/rxjs-interop` |
| `route.paramMap.pipe(switchMap(...))` | `resource`, `rxResource`, `httpResource` (v19) | `@publicApi 22.0`: stable since v22 |

### Two kinds of things

A signal holds a value that is true right now: the member who is signed in, the books on a shelf, the loan being edited. An
observable describes things that happen over time: a keystroke, a server push, a timer tick, a request that will answer
later. Most review findings in this folder come from putting one kind of thing in the other kind of container.

```flow
event (keystroke, push, tick) -> observable pipeline
observable pipeline -> toSignal
toSignal -> signal graph (signal, computed)
signal graph (signal, computed) -> template
signal graph (signal, computed) -> toObservable
toObservable -> observable pipeline
```

Cross the border once on each side: `toObservable` when a value needs time-based operators, `toSignal` when the result has to
reach a template.

> [!NOTE]
> `toSignal`, `toObservable`, `effect` and `takeUntilDestroyed()` without arguments must run in an injection context: a
> field initializer, the constructor, or a factory. Each accepts an `injector` (or a `DestroyRef`) when you need it later.

> [!WARNING]
> `toSignal` subscribes as soon as it is called, not when the signal is first read, and keeps the subscription until its
> injection context is destroyed. In a component that is the component's lifetime; in a `providedIn: 'root'` service it is
> the whole session. Its options also change the type: plain `toSignal(obs$)` is `Signal<T | undefined>`, `initialValue`
> makes it `Signal<T | typeof initialValue>`, and `requireSync: true` makes it `Signal<T>` but throws if the source does not
> emit synchronously on subscribe.

---

## Chapter 1: state that is read in two ways (exercise 01)

### Who reads the state

Shared state has two kinds of readers, and they want different things. A template, a `computed` or a click handler needs the
current value, synchronously, right now. A pipeline (a polling loop, a merge with a websocket) needs to hear about changes
over time. A `BehaviorSubject` serves the second kind directly and the first kind only through a subscription or a back door
(`subject.value`). A signal serves the first kind directly and the second through `toObservable`.

So the question for a store is: who reads it most, and how? When most readers are templates and derived values, a signal is
the simpler container.

```ts
@Injectable({ providedIn: 'root' })
export class LoanStore {
  private readonly state = signal<Loan[]>([]);

  readonly loans = this.state.asReadonly();
  readonly active = computed(() => this.state().filter((loan) => !loan.returned));

  lend(book: Book, member: Member) {
    this.state.update((loans) => [...loans, { bookId: book.id, memberId: member.id, returned: false }]);
  }
}
```

`asReadonly()` gives consumers a `Signal` without `set` or `update`, so only the store can write.

### Keep it observable when

- most consumers are RxJS pipelines (merged with a websocket, throttled, retried), and turning it into a signal would only
  add a `toObservable` at every use;
- you are migrating gradually: leave the service on observables and put `toSignal` at the edge, in the components that read
  it, until the callers have moved;
- what you are storing is really a stream of events (clicks, messages), not a current value.

Migrating a store changes every consumer's API (`loans$` to `loans()`), so it is a change to plan, not a drive-by edit.

### Equality is part of the contract

A signal decides whether it changed with `Object.is` unless you pass an `equal` function. So does a signal input, and so does
OnPush when it compares an input binding. `Object.is(a, a)` is true even after you changed what is inside `a`.

```ts
const shelf = signal<Book[]>([]);

shelf().push(someBook);           // the array changed, the signal did not: nobody is notified
shelf.set(shelf());               // same reference again: still nobody is notified
shelf.update((books) => [...books, someBook]); // new reference: every consumer is notified
```

Never change a value in place after it has been handed out. Build a new array, and a new object for each item you changed.

### Derived values without glitches

`computed` is lazy (it runs when someone reads it), memoised (it keeps its last value until a dependency changes), and
glitch-free: when several dependencies change because of one write, a reader never sees a mix of old and new values.

Compare a member's display name built both ways:

```ts
// RxJS: two views of the same source, recombined
const first$ = member$.pipe(map((m) => m.firstName));
const last$ = member$.pipe(map((m) => m.lastName));
const fullName$ = combineLatest([first$, last$]).pipe(map(([f, l]) => `${f} ${l}`));

// signals: one source, read once per evaluation
const fullName = computed(() => `${member().firstName} ${member().lastName}`);
```

```marbles
member$:    a-----b----------
first$:     a-----b----------
last$:      a-----b----------
fullName$:  a-----cb---------   // c = new first name with the old last name
```

When `member$` emits `b`, `first$` emits before `last$`, and `combineLatest` produces a name that never existed (`c`) before
the correct one. The `computed` reads both fields from the same `member()` value, so it cannot.

### Review questions

- For each piece of state, list every path that writes it. Does each one produce new references for what it changed?
- Who can write this state, and through which API?
- Where do two consumers of the same data take different routes to it?
- Are any derived values recombined from streams that come from one source?

**Now do exercise 01.**

---

## Chapter 2: local state that belongs to something else (exercise 02)

### The problem

A list of books filtered by genre, shown in pages of twenty. The user is on page 4 of "Science fiction", then picks
"Poetry", which has two pages. If the page index survives the filter change, the user lands on an empty page 4. The page
index is local, writable state (the user clicks "next"), but it only makes sense for one filter value.

In v17 you fixed that with `ngOnChanges` or a subscription that reset the field, and every reset was one more place to
forget. Inputs are signals now, so the relationship can be declared once.

### Inputs as signals

```ts
export class GenreShelf {
  readonly genre = input.required<string>();
  readonly books = input.required<Book[]>();

  protected readonly matching = computed(() => this.books().filter((b) => b.genre === this.genre()));
  protected readonly pageCount = computed(() => Math.ceil(this.matching().length / 20));
}
```

`computed` follows the inputs automatically. Anything that is purely derived belongs here and nowhere else.

### `linkedSignal`: writable, with a reset rule

```ts
protected readonly page = linkedSignal({
  source: this.genre,
  computation: () => 0,
});

protected next() {
  this.page.update((p) => Math.min(p + 1, this.pageCount() - 1));
}
```

`page` behaves like any writable signal until its source notifies; then it runs `computation` again. The computation also
receives the new source value and the previous `{ source, value }`, so it can keep a value that is still valid instead of
always starting over:

```ts
computation: (genre, previous) => (previous && previous.value < this.pageCount() ? previous.value : 0),
```

```flow
genre (input) -> page (linkedSignal)
user clicks next -> page (linkedSignal)
page (linkedSignal) -> template
```

### What counts as "the source changed"

The reset fires when the source signal notifies, and a signal notifies when its new value is not equal to the old one
(`Object.is` by default, or the `equal` function you gave it). So the reset rule is exactly as precise as the source's
equality. Decide which change of the outside world should throw the local state away, and make sure the source notifies for
that change and only for that one.

When not to use it: if the state never needs to be written locally, it is a `computed`. If it must survive every change of
its input, it is a plain `signal`.

### Review questions

- For each piece of local state, which outside value does it belong to?
- Which state is derived (and should be `computed`), and which is chosen by the user?
- For state the user chooses, what event should reset it, and what should not?
- Is there code whose only job is to turn an input into something reactive?

**Now do exercise 02.**

---

## Chapter 3: async state as one value (exercise 03)

### The problem

Loading something has more than one moment: before the request, while it runs, after it succeeded, after it failed, and
again when the user asks for something else. Code that tracks those moments in separate fields has to update every field
from every callback, and the reviewer has to check each combination. A resource describes the request once and derives the
rest.

### Let the route hand over the parameters

`withComponentInputBinding()` in the router config binds route params, query params and route data to inputs of the routed
component. When the route has no matching key, the router sets the input to `undefined`, so a default value on the input
alone is overwritten. Put the default in the transform:

```ts
export class ShelfPage {
  readonly code = input.required<string>();
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
}
```

### `rxResource` with two params, and an idle state

```ts
export class LoanHistory {
  private readonly api = inject(LoanApi);
  readonly memberId = input<number | undefined>(undefined);
  readonly year = input(2026);

  protected readonly history = rxResource({
    params: () => {
      const id = this.memberId();
      return id === undefined ? undefined : { id, year: this.year() };
    },
    stream: ({ params }) => this.api.history(params.id, params.year),
  });
}
```

While no member is selected, `params` returns `undefined` and the resource stays `idle` without calling the server. When
either `memberId` or `year` changes, the resource unsubscribes from the running `stream` (which aborts an HTTP request) and
starts a new one.

`status()` is one of `'idle'`, `'loading'`, `'reloading'`, `'resolved'`, `'error'` or `'local'`. `isLoading()`, `error()`,
`hasValue()` and `value()` are all read from it, so they cannot disagree. An error belongs to one run: the next params value
starts clean.

```marbles
params:    -----1---------2---------3----   // nothing before frame 5: params returns undefined
run 1:     ---------a|-------------------
run 2:     ------------------#-----------
run 3:     ---------------------------c|-
status:    I----L---R-----L--E------L-R--   // I idle, L loading, R resolved, E error
```

> [!WARNING]
> In the `error` state, `value()` throws. Guard it with `hasValue()` (or check `error()` first) before reading it in a
> template or a `computed`.

### Keep the old value, or blank it?

In v22, when params change the resource goes to `loading` and `value()` becomes `undefined` (or the `defaultValue` you
passed). `reloading`, which keeps the previous value visible, only happens when you call `reload()` for the same params.
Blanking is the honest default: the screen never shows member A's history under member B's name. If the UX needs the old
value to stay while the next one loads (a table that should not flicker), keep the last resolved value yourself in a
`linkedSignal`, or keep that part in RxJS.

### Which resource

- `httpResource` (from `@angular/common/http`) when the request is a plain `HttpClient` GET described by a URL or a request
  object. Shortest, and it goes through your interceptors.
- `rxResource` when the loader is already an observable from a service, or needs operators.
- `resource` when the loader is a `Promise` (`fetch`, an SDK). It receives an `abortSignal` to cancel.

When not to use any of them:

- Writes. A resource re-runs when its params change, which is the wrong model for `POST`, `PUT` or `DELETE`. Call those from
  an event handler, and `reload()` the affected resource afterwards.
- Polling, streaming and anything where time is part of the meaning: keep that in RxJS and cross with `toSignal`.

### Review questions

- How many separate pieces of state describe this one request? List every path that writes each of them.
- What keeps this loading logic alive after its first failure?
- What does the user see while the next value loads: the new state, or leftovers from the previous request?
- Which manual cleanup here exists only because the framework is not owning the request?

**Now do exercise 03.**

---

## Chapter 4: when the problem is time (exercise 04)

### What signals do not do

Signals are built for state, and two of their properties work against event streams.

- They coalesce. If a signal changes five times before its consumers run, an `effect` or `computed` sees only the last value.
  For state that is correct. For events where each one matters, the intermediate ones are gone.
- They have no clock. There is no signal operator for "wait 300 ms", "drop this if a newer one arrives", or "ignore values
  equal to the previous one after trimming".

An `effect` that starts async work on every run adds a third problem. Each run starts an independent subscription, and
responses arrive in whatever order the server sends them. The effect's `onCleanup` can unsubscribe the previous run, which
fixes the ordering, but you still have no debounce and no de-duplication, and you still have an effect writing state. Each of
those you rebuild by hand is an RxJS operator you already have.

```marbles
term:       1-2-3-4------------------
request 3:  ------------------y|-----   // slow answer for an older term
request 4:  ------------z|-----------
results:    ------------z-----y------   // the older answer lands last
```

> [!IMPORTANT]
> An `effect` whose job is to `set` another signal is almost always a missing `computed`, `linkedSignal` or resource. Effects
> are for pushing state out of Angular: storage, logging, a third-party widget.

### What each operator decides

Learn the operators one decision at a time, with a stream that has nothing to do with search: a librarian scanning book
barcodes at the returns desk.

`debounceTime(n)` decides when a value is worth acting on: it waits until the source has been quiet for `n` and then emits
the last value.

```marbles
scans:      1-2-3--------4-----------
debounced:  ---------3---------4-----   // one value per burst, after the pause
```

`distinctUntilChanged()` decides whether a value differs from the previous one. A double scan of the same barcode is dropped:

```marbles
scans:      1--1--2--2--2--3---------
distinct:   1-----2--------3---------
```

The flattening operator decides what happens to work still running when the next value arrives. Here each scan starts a
lookup that takes a while:

```marbles
scans:      1----2------------------
lookup 1:   ---------a|-------------
lookup 2:   --------------b|--------
switchMap:  --------------b---------   // lookup 1 was cancelled when 2 arrived
mergeMap:   ---------a----b---------   // both kept, in the order they finish
```

At the returns desk every scan must be processed, so `mergeMap` (or `concatMap`, to keep order) is right and `switchMap`
would lose returns. For a read where only the latest answer matters, the opposite holds. Choose from the business rule.

### Crossing back and forth

Keep the input as a signal, because templates and event handlers like signals. `toObservable(sig)` turns it into a stream
for the operators, and `toSignal` brings the result back for the template. `toObservable` emits the latest value once its
internal effect runs, so emissions are asynchronous, and several quick writes can reach the pipeline as one value. For
events where every intermediate value matters, start from an observable source (`fromEvent`, a `Subject`) instead.

Angular 22 also ships an experimental `debounced(source, wait)` that returns a `Resource` following a signal after a delay.
It is marked `@experimental 22.0` in the type definitions, so weigh that before relying on it in production code.

### Review questions

- How many requests does one user action cause? How many happen before the user did anything?
- If two requests are in flight, which one decides what the screen shows?
- Which rules about the input (length, whitespace, repeats) are enforced, and where?
- Is there an `effect` writing to a signal? What would replace it?

**Now do exercise 04.**

---

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write the
two-sentence PR comment you would leave for the author. If you cannot write it without looking, reread the chapter.
