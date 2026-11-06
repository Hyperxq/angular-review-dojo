# State at scale: a lesson before the exercises

State bugs are the ones users describe as "the app lies". Two parts of the screen disagree. An edit disappears after a
navigation. A list shows what the server held ten minutes ago. A value is changed from three places and nobody can say
which of them owns it. Users stop trusting the numbers, support cannot reproduce the report, and the developer who fixes
it adds a fourth place that writes the value. A reviewer's job is to ask, for every piece of state, where it lives, who
may change it, and how long it lives.

How to use this lesson:

- Read one chapter, then do its exercise. Each chapter assumes you finished the previous exercise.
- The examples use a library app on purpose: books, members, loans and shelves. The lesson gives you the rules; the
  exercise asks you to find where they are broken.
- Every chapter ends with review questions. Some point at the exercise, others ask you to apply the rule to a new case.

### Where should this state live?

Climb this ladder one rung at a time, and stop at the first rung that works:

| Rung | Use it when | Example in the library app |
|------|-------------|----------------------------|
| Derive it, do not store it | The value can be computed from other state | Number of books on loan |
| A component, or the URL | One component owns it, or it should survive a shared link and the back button | The catalogue filter and page number belong in query parameters: should a link a librarian sends show the same results? |
| A service with signals | A few components share it | The signed-in member's preferences |
| A `signalStore` | The state has structure, rules and several writers | Shelves and their books |
| An event-driven store (classic NgRx, or `@ngrx/signals/events`) | You need an audit trail of what happened, devtools time travel, or features reacting to each other's events | Circulation history that compliance must replay |

Every rung up adds ceremony, so climbing higher than the state needs is a cost too.

### Server state is a cache

Most of what a library app shows belongs to the server: books, loans, availability. On the client it is a **cache**, and a
cache raises questions that client state does not: how old is it, who invalidates it, and what does the screen show while
it reloads? `resource`, `rxResource` and `httpResource` in `@angular/core`, `@angular/core/rxjs-interop` and `@angular/common/http` (stable since v22),
and `@ngrx/signals/resource` for stores, are built for that. Client state (a draft, a selection, an open panel) has no
second copy anywhere, so it never goes stale; it just has to be correct. Treat "stale data" as a topic of its own: ask
when each cached value was fetched and what refreshes it.

### Grading state findings

This is a Part 2 topic, so you grade what you find with the README's labels: **blocking**, **should-fix**, **nit**,
**question**. Four questions settle most grades:

1. Can the screen show something false? A false value that users act on is wrong behaviour.
2. Can data reach the wrong owner (another person, another record, another tab)? That can be a privacy problem.
3. How likely is the timing? A bug that needs two requests within 50 milliseconds happens daily on a busy day.
4. Can a test catch it? A bug that only appears under timing nobody tests will come back.

Three examples, none from the exercises:

- **A member's avatar cached for an hour after they change it.** False, but harmless and self-healing. A **nit**, or a
  **question** about the cache policy.
- **A review draft lost when the member navigates away and back.** Whether that is acceptable is a product decision: for a
  one-line comment it is **should-fix**, for a long review the member spent twenty minutes on it is **blocking**.
- **A cached search result still shown after a librarian corrected the catalogue.** A member searches for an author and
  gets a book that was withdrawn this morning, then walks to an empty shelf. False, and users act on it. **Should-fix**
  for a cache that refreshes within minutes, **blocking** if nothing ever invalidates it.

## Chapter 0: what moved since Angular 17

### Signals became the way Angular learns about change

The app is zoneless (no `zone.js` installed, the default since v21) and components default to OnPush (`Eager` is the old
always-check strategy; `Default` is a deprecated alias of it). Angular re-renders a component when a signal its template
reads changes, when a template event handler runs, or when an `async` pipe receives a value. A plain field written from a
callback is invisible. State that the screen shows belongs in signals.

### From v17 shapes to v22 shapes

| v17 | v22 |
|-----|-----|
| `BehaviorSubject` + `asObservable()` | `signal()` + `asReadonly()` |
| NgRx selector | `computed()` (or `withComputed` in a store) |
| Reducer | A store method calling `patchState` |
| NgRx effect | `rxMethod`, `signalMethod`, or an effect in `withHooks` |
| `combineLatest([a$, b$]).pipe(map(...))` | `computed(() => f(a(), b()))` |
| Component-local `BehaviorSubject` state | `signal()`, or `signalState()` from `@ngrx/signals` for an object |
| (bridging) | `toSignal(obs$)` and `toObservable(sig)` from `@angular/core/rxjs-interop` |

### The signal toolbox

| API | Status in v22 | Use it for |
|-----|---------------|-----------|
| `signal(v)` / `.set` / `.update` | stable | A source of truth you write. |
| `.asReadonly()` | stable | Handing out read access without write access. |
| `computed(() => …)` | stable | A value derived from other signals. Lazy, memoized, current when read. |
| `effect(() => …)` | stable since v20 | Pushing signal values out to something that is not a signal: storage, logging, a chart library. |
| `linkedSignal(…)` | stable since v20 | A writable value that resets when its source changes. |
| `resource` / `rxResource` / `httpResource` | experimental in v19, stable in v22 | Async state driven by signals, with `value()`, `isLoading()`, `error()`, `hasValue()`. |
| `untracked(() => …)` | stable | Reading a signal inside a reactive function without depending on it. |
| `input()`, `model()`, `output()` | stable | Component inputs and two-way bindings as signals. |

Effects do not run at the moment a signal is set: Angular schedules them and runs them later, as part of its update
cycle. Signals compare new values with `Object.is` by default, so setting a signal to the same object reference, even
after mutating that object, notifies nobody.

### Where a service lives (DI facts)

The DI lesson covers this in depth. In short: a service provided in root (`providedIn: 'root'` or `@Service()`) has one
instance for the app; one listed in a route's `providers` has one instance for that route subtree; one listed in a
component's `providers` has one instance per component instance, destroyed with it.

### SignalStore

This repo installs `@ngrx/signals` 22.0.1. Its `signalStore` builds an injectable class from features:

```ts
export const ShelfStore = signalStore(
  { providedIn: 'root' },
  withState({ shelfName: 'New arrivals', books: [] as Book[] }),
  withComputed(({ books }) => ({ count: computed(() => books().length) })),
  withMethods((store) => ({
    rename(shelfName: string) {
      patchState(store, { shelfName });
    },
  })),
);
```

| Feature | What it adds |
|---------|-------------|
| `withState` | One signal per top-level key (`store.shelfName()`, `store.books()`). |
| `withComputed` | Derived signals. |
| `withMethods` | The operations, the only place that should call `patchState`. |
| `withHooks` | `onInit` / `onDestroy`, run in an injection context. |
| `withProps`, `withLinkedState` | Extra members, and linked (resettable) state. |
| `withEntities` (from `@ngrx/signals/entities`) | A normalized collection: `entityMap`, `ids`, `entities`. With a named collection (`{ collection: 'book' }`) the members are prefixed (`bookEntityMap`), and every entity updater needs the same `{ collection: 'book' }`. |
| `rxMethod` (from `@ngrx/signals/rxjs-interop`) | A method fed by an RxJS pipeline. |

State is protected by default: outside the store, `patchState(store, …)` is a type error, so writes go through methods.
Tests that need to set state directly can use `unprotected(store)` from `@ngrx/signals/testing`.

The base features have no actions. The events plugin (`@ngrx/signals/events`, with `eventGroup`, `withReducer`,
`withEventHandlers` and `injectDispatch`) adds an event layer when you want one, and that tradeoff is yours: an audit
trail and decoupled features, against more code per change.

## Chapter 1: facts, views and copies (exercise 01)

### The problem

A screen that disagrees with itself is worse than a screen that is slow. Users act on the number they happen to look at,
and support hears two contradicting reports of the same account. The cause rarely sits where the symptom shows: someone
adds a new way to change the data, forgets a value that depended on it, and the wrong number appears weeks later on a
page nobody touched. The root habit is keeping one truth in more than one place.

### The mental model: facts and views

For every piece of state, ask two questions:

1. Is this a fact, something nobody can compute from anything else? Or a view of other facts?
2. Who is allowed to change it?

Take a loan. When it was checked out and which tier the member has are facts. How many days the loan lasts, the due
date, and whether it is overdue are views:

```tree
Loan
  checkedOutOn [fact]
  memberTier [fact]
    loanDays [view of tier]
      dueOn [view of checkedOutOn and loanDays]
        isOverdue [view of dueOn and now]
```

Store `dueOn` as a fact and you get a second truth to maintain. The member upgrades to a tier with longer loans, the tier
changes, and the due date stays where it was, unless every code path that changes a tier also remembers to recompute
every due date.

`computed` turns a view into something that cannot drift:

```ts
@Injectable({ providedIn: 'root' })
export class Clock {
  // a signal that ticks, so computed values that depend on time stay live
  readonly now = toSignal(interval(60_000).pipe(map(() => new Date())), { initialValue: new Date() });
}

export class LoanCard {
  readonly loan = input.required<Loan>();
  private readonly policy = inject(LoanPolicy);
  private readonly clock = inject(Clock);

  protected readonly dueOn = computed(() =>
    addDays(this.loan().checkedOutOn, this.policy.loanDays(this.loan().memberTier)),
  );
  protected readonly isOverdue = computed(() => this.dueOn() < this.clock.now());
}
```

A computed is only as live as its signal inputs. Write `isOverdue` with `new Date()` inside instead of `clock.now()`, and
it never flips at midnight: nothing it reads is a signal that changes, so it never recomputes. When you review a
`computed`, look for hidden non-signal inputs: the current time, `localStorage`, a plain field, a global.

> [!IMPORTANT]
> Fact or view is a business question, so ask it. If the library's rule is "the due date is fixed at checkout, whatever
> happens to the tier later", then `dueOn` is a fact and storing it is correct. The code is wrong only when it stores a
> value the business considers derived.

### A read is a moment; a read in a reactive context is a subscription

A signal read returns the value at that instant. Whether the reader stays connected depends on where the read happens:

| Where the read happens | What you get |
|------------------------|--------------|
| In a template, `{{ book.title() }}` | A live dependency. The view updates when the signal changes. |
| Inside `computed(() => …)` or `effect(() => …)` | A live dependency of that computed or effect. |
| In a field initializer or constructor, `title = book.title()` | A plain value, copied once. |

Copies are sometimes exactly right. An edit form should start from the book's current data and then let the librarian
type without the server's data overwriting every keystroke. That draft is a deliberate copy, and `linkedSignal` gives it
the one link it still needs:

```ts
export class EditBookForm {
  readonly book = input.required<Book>();

  // a writable draft that resets when a different book is opened
  protected readonly draftTitle = linkedSignal({
    source: () => this.book().id,
    computation: () => untracked(() => this.book().title),
  });
}
```

The source is the book's id, so the draft resets when another book is opened. Had the source been the title itself, a
background refresh that changes the title would wipe what the librarian typed, and reopening a book with the same title
would keep a stale draft. Which value the draft follows is a design choice; make it on purpose.

A copy becomes a bug when the screen presents it as current. When you see a signal read outside a reactive context, ask
which one the author meant, and whether the name tells the next reader.

### Read access without write access

A public `signal()` on a shared service is a public setter. The contrast is two lines:

```ts
readonly dailyGoal = signal(20);                         // anyone can .set() it
readonly dailyGoal = this._dailyGoal.asReadonly();       // read here, write through the service's methods
```

### Review questions

- If you deleted this stored value, could you compute it from what remains? If yes, what is it doing in state?
- What hidden non-signal inputs does each `computed` read?
- Is this server state or client state? If it is server state, who invalidates it?
- Would this value belong in the URL?
- What is the worst value any component could put into this service's state?

**Now do exercise 01.**

## Chapter 2: stores, references and normalized data (exercise 02)

### The problem

A store is shared by views that different people wrote at different times. Each view trusts the store to tell it when
something changes, and the store's rules for when it does (references, copies, scheduling) are not visible in the
component code. When a rule is broken, the people affected are users looking at contradicting screens, and the developer
who spends a day in the debugger before finding a one-line cause.

### `patchState` compares references, one level deep

`patchState(store, updater)` builds the new state, then compares each top-level key with the old one using `!==`. Only
keys whose reference changed get their signal set. That is how `@ngrx/signals` 22.0.1 behaves (see `patchState` in
`node_modules/@ngrx/signals/fesm2022/ngrx-signals.mjs`).

The rule for updaters follows from it: return new references for everything you changed, at every level you changed,
up to the top-level key. Spread, `map`, `filter` and `toSpliced` return new values. `push`, `splice`, `sort`, property
assignment, and `add` or `set` on a `Set` or `Map` change a value in place. Deep spreads that get tiring are a hint that
the shape of the state is wrong, which leads to the next section.

### Normalize what is shared, embed what is historical

When the same entity is embedded in several places, an update reaches one copy and the others go stale. Normalizing means
one collection per kind of entity, references by id, and views that join them:

```tree
LibraryState
  books [record by id]
  loans [record by id, each with a bookId]
  loanRows [view joining loans with books]
```

The join is a lookup. In a component that receives both records, it can be as small as this:

```ts
protected readonly loanRows = computed(() => {
  const books = this.books(); // Record<number, Book>
  return this.loans().map((loan) => ({ loan, title: books[loan.bookId]?.title ?? 'Unknown book' }));
});
```

In a store, `withEntities` keeps each collection as a map by id plus an ordered list of ids, and its updaters
(`addEntity`, `updateEntity`, `removeEntity`, `setAllEntities`, `upsertEntity` and the plural forms) return new
references, so `patchState` notices.

Do not normalize everything. A receipt for a paid fine should show the book's title as it was on the day of payment, even
if the catalogue changes later. That is a historical record, and embedding a copy is the correct model. The question is
the one from chapter 1: should this value follow the source, or stay as it was?

### `computed`, `linkedSignal` and `effect` do different jobs

A shelf page lets the librarian sort its books. When the librarian opens another shelf, the sort order should go back
to "by title". A common first attempt uses an effect:

```ts
effect(() => {
  this.shelfId();          // track the shelf
  this.sort.set('title');  // reset the sort
});
```

```flow
openShelf -> shelfId signal: written now
shelfId signal -> effect: scheduled for later
effect -> sort signal: written later
sort signal -> Template: rendered after that
```

Between the first write and the effect, the new shelf and the old sort coexist. Anything that reads both in that window
(a request built from them, for example) uses a combination the user never chose. The effect also costs a second write
per change, and an effect that writes what it reads can trigger itself.

The sort is state the user writes and that resets when its source changes, which is what `linkedSignal` describes:

```ts
protected readonly sort = linkedSignal({
  source: this.shelfId,
  computation: (): SortOrder => 'title',
});
```

| Tool | Use it when the value | Do not use it when |
|------|----------------------|--------------------|
| `computed` | is fully determined by other signals | users must be able to overwrite it |
| `linkedSignal` / `withLinkedState` | is writable, and resets or recomputes when a source changes | it never needs a manual write (use `computed`) |
| `effect` / `withHooks` effect | must leave the signal graph: storage, logging, analytics, a DOM API | the result is more signal state |

A correct effect looks like this, and nothing reads its output back into the graph:

```ts
effect(() => localStorage.setItem('shelf-view', this.viewMode()));
```

### Review questions

- Does this need a store at all, or would a component signal or a service do?
- Where does each entity live? If it appears in more than one place, which copy wins when it changes, and is that
  intended?
- For each `effect` or hook: does its output leave the signal graph, or does it write signals that something else reads?
- After any write, is there a window in which two values disagree? Who could read them in that window?

**Now do exercise 02.**

## Chapter 3: optimistic updates, overlap and ownership (exercise 03)

### The problem

Optimistic UI makes an app feel instant, and it makes a promise: if the server says no, the screen goes back to the truth.
When the promise is broken, users act on things that did not happen, or see data that belongs elsewhere. These bugs need
timing that a developer rarely reproduces at a desk (two requests in flight, a slow network), so they reach production
and come back as reports nobody can reproduce.

### An optimistic update is a bet with a written undo

A book record has a title and a shelf. A librarian fixes the title, then a moment later moves the book to another shelf.
Both changes appear at once; both requests go out. The title request fails late, after the shelf request succeeded:

```marbles
user:      t-s-------------     // edit the title, then the shelf
title:     t-------#            // fails late
shelf:     --s---|              // succeeds
```

If the undo for the title puts back the whole record as it was before frame 0, it also undoes the shelf move, which the
server accepted. Whatever strategy the code uses, it has to answer one question: has anything else written this state
since my request started?

| Strategy | How it undoes | Fits when | Breaks when |
|----------|---------------|-----------|-------------|
| Revert unconditionally | Put back the value from before the change. | Nothing else can write that state while the request is in flight. | Anything else wrote in between: the revert erases it. |
| Revert only if still mine | Put back the old value only if the current value is still the one this request wrote. | One field, last write wins. | Several fields change together. |
| Reconcile | On failure (or always), reload the truth from the server. | The server is cheap to ask and the source of truth. | Offline, or when the reload is slow and the UI flickers. |
| Version | Each local change bumps a counter; responses for an older version are dropped. | Many overlapping writes to the same state. | Different parts of state need different versions. |
| Do not be optimistic | Show progress, change the UI when the server confirms. | The action is expensive or irreversible: paying a fine, cancelling a membership. | Never wrong, only slower. |

The last row is a real option: an optimistic update needs a believable undo, and some actions do not have one.

### Success can be wrong too

Overlap is not only about failures. An autosave sends the title "Dune", and a moment later the librarian presses Save
with "Dune Messiah". Both requests succeed, but nothing guarantees they reach the server in the order they were sent. If
the autosave arrives last, the server holds "Dune" while the screen shows "Dune Messiah". Two ways out, both decided with
the backend: send writes to one resource one at a time, so the second waits for the first; or have the server reject
stale writes with versions (an ETag or a version number that each write must match).

### State has an owner

Every slice of state belongs to something: the app, a route parameter, a browser tab, a person. Ownership is a question to
ask, slice by slice:

- Name the owner of this slice. Is it written down anywhere, in a type, a key or a provider?
- When the owner changes (another record opens, another person signs in, the tab closes), what happens to the slice?
- What happens to requests still in flight for the old owner when their answers arrive?

The provider scopes in chapter 0 are one set of tools; the shape of the state is another. Which fits depends on the
owner, and on what should happen to the data when the owner changes.

### Review questions

- Put one operation on a timeline and add a second request. What does each response or failure write, and when?
- If this request's response arrived last, what would the server hold, and what would the screen show?
- Name the owner of every slice the operation touches. What happens to each slice when the owner changes?
- Which of these timings could a unit test reproduce, and does one?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch. Compare its severity table with yours
first, then the fix. Then write the PR comment you would leave, and state the impact instead of the rule: "members can
reserve a withdrawn book for up to an hour, because nothing clears the search cache" is a comment an author acts on;
"cache invalidation is missing" is one they argue with.
