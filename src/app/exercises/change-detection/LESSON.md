# Change detection: a lesson before the exercises

In v17 change detection was something that happened to you. Zone.js noticed every timer, promise and DOM event, then Angular
walked the component tree and checked what it was allowed to check. You learned `OnPush`, `markForCheck()` and the
occasional `detectChanges()`, and you learned to fear `ExpressionChangedAfterItHasBeenCheckedError`. The ideas are the same in
v22, but the defaults moved so far that code which was correct in v17 can now render nothing at all. This lesson rebuilds
the model from the ground up.

How to use it:

- Read chapter 0 and open the playground (folder `00-playground`) before the first exercise. Then read one chapter, do its
  exercise, and move on.
- The examples use a library (books, members, loans, shelves). The exercises use something else on purpose.
- Each chapter ends with review questions. Ask them while you read the exercise code.

---

## Chapter 0: what moved since Angular 17

### No zone, so nobody announces "something happened"

`zone.js` is not installed in this app, and since v21 zoneless is Angular's default. Angular now renders only when it is told
that state may have changed. The notifications that matter in day-to-day code are these:

- a signal read by a template changed;
- a listener in a template or a host binding ran (`(click)`, `(input)`, `@HostListener`);
- `markForCheck()` was called, which the `async` pipe does for you when it receives a value;
- an input was set through `ComponentRef.setInput` (what tests do);
- a view was attached, or a `@defer` block changed state.

A plain field written from `setTimeout`, a promise, a WebSocket callback or a third-party library is not on that list. The
value changes in memory and the screen stays where it was until something else on the list happens.

The most common v17 code that stops rendering is the plainest one:

```ts
this.http.get<Book[]>('/api/books').subscribe((books) => (this.books = books));
```

The response arrives, `this.books` changes, and nothing is told. The bridges are `toSignal(this.http.get(...))`, the `async`
pipe, or a resource (`httpResource`, `rxResource`), each of which notifies Angular when the value arrives.

`NgZone` still exists so that old code compiles. Without zone.js it is a `NoopNgZone`: `run(fn)` and
`runOutsideAngular(fn)` both just call `fn`. Neither one renders anything.

### OnPush is the default, Eager is the old default

| v17 | v22.2 |
|-----|-------|
| `ChangeDetectionStrategy.Default` (check whenever traversal reaches me) | `ChangeDetectionStrategy.Eager`; `Default` is a deprecated alias |
| `OnPush` opt-in | `OnPush` when you write nothing |

So `changeDetection: ChangeDetectionStrategy.Default` in a v22 file is an explicit opt-out of OnPush, usually written to make
something "work". Treat it as a question for the author.

### The three steps of a render

```flow
notification (signal write, listener, markForCheck) -> scheduler
scheduler -> ApplicationRef.tick
ApplicationRef.tick -> refresh views marked dirty
refresh views marked dirty -> afterRender hooks
afterRender hooks -> dev mode checkNoChanges pass
```

Refreshing a view runs its compiled template function. Each binding computes its value, compares it with `Object.is` to the
value stored from last time, and writes to the DOM only if it differs. There is no virtual DOM: comparison and DOM write
happen in the same pass. If refreshing makes more views dirty (a signal written during the pass), the tick refreshes again,
up to 10 rounds, and dev mode throws `NG0103` after that. A single view that keeps marking itself dirty is re-run at most 100
times, and that limit throws `NG0103` in production too.

### What a refresh visits

An Eager view is refreshed whenever its parent is. An OnPush view is refreshed only when it is dirty: an input got a new
reference, a listener inside it fired, `markForCheck()` was called on it or a descendant, or a signal its template reads
changed.

Signals are more precise than `markForCheck()`. A signal write marks the views that read it for refresh and marks their
ancestors only for traversal: Angular walks through them to reach the dirty view without running their templates.

```tree
LoanDesk
  MemberHeader [OnPush]
  LoanList [OnPush]
    LoanRow (reads the dueDate signal) [OnPush]
    LoanRow [OnPush]
  LoanTotals [Eager]
```

Write the `dueDate` signal and only the first `LoanRow` template runs. Click a button inside `LoanDesk` instead, and
`LoanDesk` is refreshed, `LoanTotals` (Eager) is refreshed because its parent was, and the OnPush children are skipped unless
they are dirty.

> [!TIP]
> Open the playground (Change detection > Playground) and its `EXPLAINER.md`. Each card shows how many times its template
> ran. Mutate the object, replace it, set a field in a timer, set a signal in a timer, and predict the counters before you
> click. If a prediction fails, reread this chapter before exercise 01.

---

## Chapter 1: references, and who gets told (exercise 01)

### The situation

A librarian renews a loan. The row shows the new due date, but the totals line under the list still counts the old one, and
the "sorted by due date" list is now in the wrong order. She reloads the page to trust what she sees. Nothing threw an
error; some views were told about the change and some were not.

### Why OnPush exists, and what it asks of you

Checking a view costs time proportional to its bindings, and an Eager tree checks everything on every tick. OnPush lets
Angular skip a whole subtree unless something says it changed. The price is a contract: the "something" must be a new
reference, an event inside the view, `markForCheck()`, or a signal it reads. An OnPush view decides whether an input changed
with `Object.is(previous, current)`, and every in-place change keeps the reference:

```ts
shelf.sort(byTitle);                     // same array, new order
Object.assign(member, { phone: '555' }); // same object, new field
holds.set(bookId, hold);                 // same Map, new entry
```

The rule is the same for every collection type: once a value has been handed to a view, a change must produce a new
reference (`[...shelf].sort(byTitle)`, `{ ...member, phone }`, `new Map(holds).set(...)`). Whether the change happens in the
owner or in a child that received the value makes no difference to the views that were not told.

### Data down, events up

```flow
owner holds the state (signal) -> child A [input]
owner holds the state (signal) -> child B [input]
child A (output event) -> owner changes the state
owner changes the state -> owner holds the state (signal)
```

One place owns each piece of state and is the only one that changes it. Views below receive values and report intentions
through outputs. Every view that shows the data then learns about a change through the same path.

### New objects, stable keys

Immutable updates create new objects for the items that changed. `@for` decides which DOM rows to keep with its `track`
expression. With `track book` (identity), every new object looks like a new row, so its DOM is destroyed and recreated:
focus, text being typed and scroll position inside the row are lost, and the work is wasted. With a stable domain key such as
`track book.isbn`, Angular keeps the row and only updates its bindings, which makes "new objects for changed items" cheap.

### `detectChanges()`, `markForCheck()` and signals

They differ in scope and in timing:

- `detectChanges()` renders now, here, and nothing else. It still skips OnPush children that are not dirty, and it tells no
  ancestor or sibling anything.
- `markForCheck()` asks for the next tick along the path from this view up to the root. The `async` pipe calls it for you.
- A signal write marks exactly the views that read it.

`markForCheck()` from a callback is a valid minimal migration step when you cannot move the state into a signal yet. A
`detectChanges()` that makes one view correct is usually a sign that other views needed the same news.

### When the tool is wrong

Immutability allocates. For a very large collection changed many times per second, copying on every change has a cost you
should measure, and a different structure (paging, a store keyed by id) may be the better answer. `Eager` is a reasonable
short migration step for a leaf component that renders mutable third-party data you do not control, as long as it stays a
leaf and someone owns removing it.

### Review questions

- For each piece of state: which component owns it, and who else changes it?
- Every time a collection changes, is a new reference produced?
- Which views show this data, and through which path does each one learn that it changed?
- Where `ChangeDetectorRef` is used, which views does it refresh, and which views needed to know?

**Now do exercise 01.**

---

## Chapter 2: the order of a pass, and the dev-mode second look (exercise 02)

### The situation

The reading-room page shows "0 books open" in its header on first load, although three are open. A teammate sees an
`ExpressionChangedAfterItHasBeenCheckedError` in the console on one page and none on another that has the same problem. The
rules below explain both.

### Who checks what, and when

During one refresh, Angular runs a view's template function top to bottom. When it advances to a child component, it runs
that child's pre-order hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`) at that point, after the parent bindings above the
child element were already evaluated. When the template function is done, the view's content hooks run
(`ngAfterContentInit`, `ngAfterContentChecked`), then child views are refreshed, and finally `ngAfterViewInit` /
`ngAfterViewChecked` run for children whose views are done.

```flow
parent bindings above the child -> child ngOnChanges, ngOnInit, ngDoCheck
child ngOnChanges, ngOnInit, ngDoCheck -> rest of the parent template
rest of the parent template -> ngAfterContentInit and ngAfterContentChecked
ngAfterContentInit and ngAfterContentChecked -> child view refreshed
child view refreshed -> child ngAfterViewInit
child ngAfterViewInit -> afterRender hooks
afterRender hooks -> dev mode checkNoChanges
```

Data flows down within a pass. A value written after its reader rendered is stale for the rest of that pass.

### Projected content belongs to its declaring template

With content projection the DOM tree and the change detection tree differ. A component inside `<ng-content>` is declared by
the template that wrote it, and that template creates and checks it.

```tree
ReadingRoom (template declares everything below)
  ShelfLayout [projects content]
    ShelfHeader
  BookOfTheWeek (declared by ReadingRoom, projected into ShelfLayout)
```

`BookOfTheWeek` appears inside `ShelfLayout` in the DOM, but its hooks run while `ReadingRoom`'s template is processed.
When two components exchange data, draw this tree first: it tells you which one reads before the other writes.

### Bindings must be idempotent

A binding is evaluated, compared with its previous value, and in dev mode evaluated again. It must return the same value
when nothing changed in between. A template method that builds a new array is not idempotent for `Object.is`:

```html
<app-book-grid [books]="overdue()" />
```

```ts
protected overdue() {
  return this.books.filter((b) => b.overdue); // a new array on every evaluation
}
```

Each evaluation is "a different value", so an OnPush child is marked on every check and a dev-mode recheck can fail with
`NG0100`. A `computed` returns the same array until `books` changes.

### A child reporting upward

A shelf component measures how many books fit and reports the number to its parent through an output, from
`ngAfterViewInit`:

```ts
readonly fitted = output<number>();

ngAfterViewInit() {
  this.fitted.emit(Math.floor(this.host.nativeElement.offsetWidth / 24));
}
```

By then the parent has already rendered its own bindings in this pass, so the number it shows is stale. Depending on the
strategies involved, the result is an `NG0100` in dev mode or a screen that stays wrong until something else renders.

The options, with their costs:

- Do DOM reads in `afterNextRender` or `afterEveryRender` (`afterEveryRender` was the developer-preview `afterRender` in v17; both are stable now), which run after rendering,
  in the browser only, and write the result into a signal. The views that read it are marked, at the price of one extra
  refresh round in the same tick.
- Publish the value earlier when the reader is a view that refreshes later in the pass (a sibling further down, or the host
  of projected content). `ngOnInit` runs during the parent's template, so it is not early enough for parent bindings above
  the child.
- Derive instead of reporting: if the parent can compute the value from data it already has, a `computed` needs no hook at
  all. An `effect` that copies one signal into another is not a derivation tool; use `computed` or `linkedSignal`.

### The second look in dev mode

After each tick, dev mode runs `checkNoChanges`, which re-evaluates bindings and throws `NG0100` if a value differs from what
was just rendered. It re-checks Eager views. OnPush views are skipped, even if they just rendered. Since OnPush is now the
default, a quiet console proves little.

`provideCheckNoChangesConfig({ exhaustive: true })` (developer preview since v20) checks every view as if it were Eager.
Turn it on in development or in tests to surface errors that OnPush hides.

### Review questions

- For each template expression, does evaluating it twice in a row give the same result?
- Which hook writes state, and which views had already rendered that state in the same pass?
- In the component tree (not the DOM tree), who reads a shared value before whom?
- What does the screen show between the first render and the moment the value is right?

**Now do exercise 02.**

---

## Chapter 3: migrating a component to zoneless (exercise 03)

### The situation

A wall display at the returns desk shows each book as it is checked in. After the zoneless migration it freezes: returns
keep arriving, the list stays still, and it jumps forward only when someone clicks elsewhere. Worse, opening and closing the
display a few times makes the tab slower, because old instances keep running.

### What zone.js used to do for you

A third-party client with plain callbacks used to "just work": the callback ran inside the zone, the zone noticed the task
had finished, and Angular checked the tree. Some teams went further and ran the client with `runOutsideAngular` (to avoid a
check per message) and then `run` around the assignment (to get one back). Without zone.js both calls are a plain function
call, so all that remains is a field assignment that nobody is told about.

```marbles
feed:      a---b---c---d---e---
clicks:    ------k-------k-----   // unrelated clicks elsewhere on the page
screen:    ------b-------d-----   // the view only catches up when something else renders
```

### Each value a template shows needs a notifier

Go through the template and, for every binding, name what tells Angular it changed. In zoneless code the answer should almost
always be "it is a signal":

```ts
protected readonly latest = signal<BookReturn | null>(null);

// inside the client's callback
this.latest.set(ret);
```

Writing a signal marks the views that read it, so the callback needs no zone and no `ChangeDetectorRef`. The same applies to
the `http.get(...).subscribe(v => this.x = v)` shape from chapter 0.

### Notifications are batched

The zoneless scheduler does not render once per notification. The first notification schedules a tick (a race between
`requestAnimationFrame` and `setTimeout`), and later ones before that tick only add to it. Fifty signal writes in one task or
frame cost one render. The per-message cost is your own work, such as copying an array on every message.

When a feed is very high frequency, writing a signal per message is still the wrong shape. Sample or throttle at the edge
(`auditTime`, `sampleTime` in RxJS, or a buffer you flush on a timer), and keep only the state the screen actually shows in
signals.

### `ngDoCheck` is not a derivation hook

`ngDoCheck` runs when Angular checks the parent view, including for OnPush children. In a zoneless app that may be rarely, or
never, while the data keeps changing. A value derived there follows the parent's refresh schedule instead of the data; a
`computed` follows the data.

### Every resource you start, you stop

A client provided in root lives as long as the app. If a component registers a handler on it and never removes it, the
handler (and through its closure, the whole component instance) stays reachable after the component is destroyed, and keeps
running on every message.

```tree
ReturnsFeed (root injector, lives for the whole session)
  handler from display instance 1 [destroyed, still referenced]
  handler from display instance 2 [destroyed, still referenced]
  handler from display instance 3 [alive]
```

Whatever a component starts (a handler, a listener, a connection, a timer), it stops. Register the cleanup next to the start
with `inject(DestroyRef).onDestroy(fn)`, or `takeUntilDestroyed()` for observables.

### Testing zoneless code

Prefer `await fixture.whenStable()` and real notifications (a click, a signal write) over calling `fixture.detectChanges()`
by hand. A test that forces a render after every step passes even when the component never notifies Angular, which is
exactly the bug you want the test to catch.

### Review questions

- For each binding in the template, what notifies Angular when its value changes?
- What does each `NgZone` call do in an app without zone.js?
- Which hook runs this calculation, and does that hook run when the data changes?
- What does the external client hold on to after this component is destroyed? Who stops it?
- Which settings or calls exist only because zone.js used to be there?

**Now do exercise 03.**

---

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write the
two-sentence PR comment you would leave for the author. If you cannot write it without looking, reread the chapter.
