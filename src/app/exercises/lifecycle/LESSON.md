# Lifecycle: a lesson before the exercises

You know the hooks by heart: `ngOnChanges`, `ngOnInit`, `ngDoCheck`, the four `After...` hooks, `ngOnDestroy`. They all still
work in v22. What changed is that many jobs you gave them now have a better home, a function that runs when the data it reads
changes instead of at a fixed moment. A hook answers "what moment is it in this component's life?". A signal-based API
answers "what does this value depend on?". Most lifecycle bugs come from code that asked the first question when it needed
the second.

How to use it:

- Read one chapter, then do its exercise. Each chapter assumes you did the previous one.
- The examples use a library (books, members, loans, shelves) and solve different problems from the exercises.
- Each chapter ends with review questions. Ask them while you read the exercise code.

---

## Chapter 0: what moved since Angular 17

### The timeline of one component

The order of the hooks has not changed since v17. What is new is where component effects and render callbacks sit in it:

```flow
constructor -> first input values set
first input values set -> ngOnChanges
ngOnChanges -> ngOnInit
ngOnInit -> ngDoCheck
ngDoCheck -> component effects
component effects -> ngAfterContentInit and ngAfterContentChecked
ngAfterContentInit and ngAfterContentChecked -> own view created or refreshed
own view created or refreshed -> ngAfterViewInit and ngAfterViewChecked
ngAfterViewInit and ngAfterViewChecked -> afterNextRender and afterEveryRender callbacks
afterNextRender and afterEveryRender callbacks -> later, when the view is removed, ngOnDestroy and DestroyRef callbacks
```

The `...Init` hooks run once. `ngOnChanges` runs each time an input binding receives a new value, compared with `Object.is`.
`ngDoCheck` and the `...Checked` hooks run every time the parent view is checked, which in a zoneless app is not the same as
"every time the data changes". The render callbacks run after the whole application finished rendering, and only in the
browser.

### New tools, and the hook each one replaces

| v17 habit | v22.2 tool | What you gain |
|-----------|------------|---------------|
| `@Input()` read in `ngOnInit` | `input()` / `input.required()` read where it is used | the value is a signal, so derived values follow it |
| `ngOnChanges` to recompute | `computed(() => ...)` | lazy (runs only when read) and memoised (runs again only when a dependency changed) |
| `ngOnChanges` to reset local state | `linkedSignal(...)` | writable, recomputed when what it reads changes |
| `@ViewChild` + `ngAfterViewInit` | `viewChild()` / `viewChildren()` | a signal that follows the element as `@if` and `@for` add and remove it |
| DOM work in `ngAfterViewInit` | `afterNextRender({ ... })` | browser only, with read and write phases |
| DOM work in `ngAfterViewChecked` | `afterRenderEffect(...)` | re-runs only when the signals it reads change |
| `ngOnDestroy` + `Subject` bookkeeping | `inject(DestroyRef).onDestroy(fn)`, `takeUntilDestroyed()` | cleanup registered next to what it cleans |
| `async ngOnInit` loading data | `rxResource`, `resource`, `httpResource` | status, error and cancellation built in |

Two renames to know: the v17 developer-preview `afterRender` is called `afterEveryRender` now, and `afterNextRender` has a
phase form (`earlyRead`, `write`, `mixedReadWrite`, `read`) that is the recommended one.

### Details that bite

- A required signal input throws if you read it before Angular has set it: `Input is required but no value is available yet`
  (`NG0950`). Reading it in the constructor is always too early. A non-required `input()` returns its default there, which
  hides the problem.
- `ngOnChanges` also fires for signal inputs. `SimpleChanges` now takes a type parameter (`SimpleChanges<MyComponent>`)
  that types its keys; the plain form accepts any string.

### When hooks are still the right tool

- `ngOnInit` for one-off work that needs the first input values and should not repeat.
- `ngOnDestroy` is fine; `DestroyRef` is the same thing, usable from functions and services.
- `ngDoCheck` for custom diffing of a mutable input you do not own (a third-party object that is changed in place), where a
  reference comparison cannot see the change. It runs often, so keep it cheap.
- `ngOnChanges` when you need the previous and the current value together, for example to animate from one to the other.

---

## Chapter 1: when an input exists, and how often you hear about it (exercise 01)

### The situation

At the loans desk a librarian picks a member, and a banner shows that member's overdue fines. She switches to another
member, and the banner still shows the first member's fines. Nothing failed, no error appeared: the component simply
computed the banner once, at a moment when only the first member existed.

### Inputs arrive after construction

Angular creates the instance first, then writes the inputs. In the constructor every decorator `@Input()` still holds its
initial value (often `undefined` behind a `!`), and anything derived there is derived from nothing.

`ngOnInit` is the first moment the inputs exist, and it runs once. A value computed in `ngOnInit` describes the first input,
then stays the same while the parent passes new ones.

```marbles
member input:  a------b--------c----
ngOnInit:      a--------------------   // computed once, from the first member
computed:      a------b--------c----   // follows every new member
```

### `ngOnChanges` only hears about new references

`ngOnChanges` runs when a binding receives a value that is not `Object.is` equal to the previous one. A parent that changes
a property of an object it already passed sends the same reference: the child gets no `ngOnChanges`, and an OnPush child is
not refreshed unless something else marks it dirty. The update is lost silently, with no error anywhere.

### Derive, and reset

```ts
@Component({
  selector: 'app-loan-form',
  template: `
    @if (fines() > 0) {
      <p role="status">{{ member().name }} owes {{ fines() | currency }}</p>
    }
    <label>Return by <input type="date" [value]="returnDate()" (change)="returnDate.set($any($event.target).value)" /></label>
  `,
})
export class LoanForm {
  readonly member = input.required<Member>();
  readonly today = input.required<string>();

  protected readonly fines = computed(() => this.member().loans.reduce((sum, l) => sum + l.fine, 0));
  protected readonly returnDate = linkedSignal(() => addWeeks(this.today(), this.member().loanWeeks));
}
```

`fines` is derived: nobody writes it, so it is a `computed`, and it is recalculated only when `member` changes and someone
reads it. `returnDate` is a suggestion the librarian may overwrite, so it must be writable; the `linkedSignal` recomputes it
whenever a signal it read changes (another member, another day) and keeps her edit otherwise.

The tradeoff between the two is one question: does anything need to write this value? If not, `computed`. If yes, and it
should start over when its inputs change, `linkedSignal`. If yes, and it should survive input changes, a plain `signal`.

### Review questions

- At the moment each value is computed, what do the inputs hold?
- Which values are computed once, and can the input change after that?
- How does this component learn that its input changed? What does it miss?
- When the parent updates the data, does it send a new reference or change the old one?
- Which local state belongs to one input value, and what resets it?

**Now do exercise 01.**

---

## Chapter 2: views, queries and the DOM (exercise 02)

### The situation

Hover a book spine on the shelf map and a tooltip with the title appears. It shows up in the top-left corner the first
time, lands in the right place only after the next hover, and on the server-rendered page an error appears in the logs
because the positioning code asked for the size of an element that does not exist on the server.

### A query holds what exists right now

`@ViewChild('name')` points at an element in the component's own view. Two facts decide what it holds:

- Before the first render the view has not been created, so in the constructor and in `ngOnInit` a dynamic query is
  `undefined`.
- An element inside `@if` or `@for` exists only while that block shows it. When the block shows it later, the query points at
  the new element, but code that ran earlier does not run again.

`{ static: true }` resolves a query before `ngOnInit`, and only for elements that are not inside a control flow block.

`viewChild()` is a signal, so code that reads it runs again when the element appears or disappears. DOM work on it belongs in
a render hook, which runs in the browser only:

```ts
export class ShelfSearch {
  readonly open = input(false);
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterRenderEffect({
      write: () => this.field()?.nativeElement.focus(),
    });
  }
}
```

### Prefer bindings

Whatever can be expressed as a binding on the element (`[class.x]`, `[style.top.px]`, `[attr.*]`, `[disabled]`) needs no
query, no hook and no timing: Angular applies it when it renders the element, every time it renders it. Reach for a query
only when you need something a binding cannot do, such as reading a size or calling `focus()`.

### Render hooks and their phases

`afterNextRender` runs once after the application's next render; `afterRenderEffect` runs after a render whenever signals it
read have changed. Their phase form lets Angular group DOM reads and writes so that layout is not forced back and forth:

```ts
export class SpineTooltip {
  readonly anchor = input.required<HTMLElement>();
  private readonly tip = viewChild.required<ElementRef<HTMLElement>>('tip');

  constructor() {
    afterRenderEffect({
      earlyRead: () => this.anchor().getBoundingClientRect(),
      write: (rect) => {
        const style = this.tip().nativeElement.style;
        style.top = `${rect().bottom + 4}px`;
        style.left = `${rect().left}px`;
      },
    });
  }
}
```

The `earlyRead` result reaches `write` as a signal. Writing the DOM directly in `write` positions the tooltip without
another render. Writing a signal from a render hook works too, but it schedules another pass: fine once, dangerous in
`afterEveryRender`, where it can loop until dev mode stops it with `NG0103`.

| Hook | When | How often | Server |
|------|------|-----------|--------|
| `ngAfterViewInit` | after this component's view is created | once | runs |
| `ngAfterViewChecked` | after every check of this view | every check, called from the parent's refresh, so even for an OnPush child that was skipped | runs |
| `afterNextRender` | after the next application render | once | skipped |
| `afterEveryRender` | after every application render | every render | skipped |
| `afterRenderEffect` | after a render, when signals it read changed | when dirty | skipped |

> [!IMPORTANT]
> On the server there is no layout and often no real DOM. Code in a constructor, `ngOnInit`, a view hook or an `effect` that
> touches `nativeElement`, `window` or `document` runs during server rendering too. The render hooks above are skipped on
> the server, which is why they are the place for DOM work.

### When render hooks are the wrong tool

Render hooks run after Angular renders. A window resize or a container that changes size because of CSS never triggers
them, so a measurement taken there goes stale.

- If the layout can be expressed in CSS (container queries, `clamp()`, grid), no JavaScript is needed at all.
- If you must measure on resize, create a `ResizeObserver` in `afterNextRender` and disconnect it with
  `inject(DestroyRef).onDestroy(...)`.
- If the change comes from Angular data (a new input, a signal), `afterRenderEffect` is the right fit.

### Expensive work belongs to the data

A calculation in `ngAfterViewChecked` or `ngDoCheck` runs on every check of the view, whatever caused that check. A
`computed` runs when its inputs change and someone reads it. Ask how often the result can actually change, and attach the
work to that.

### Review questions

- At the moment this code runs, does the element it queries exist? What happens when it appears later?
- Could this DOM change be a template binding instead?
- When a hook writes a field the template reads, what schedules the next render?
- Which code touches the DOM, and does it also run on the server?
- How often does each calculation run, compared with how often its input changes?

**Now do exercise 02.**

---

## Chapter 3: half-migrated components (exercise 03)

### The situation

The catalog team migrated its shelf widgets to signals one file at a time. Each widget still renders, but some never show
their data, one keeps a request alive after it is removed, and one shows yesterday's value for a moment after every change.
Half-migrated code mixes two timing models, and each mismatch fails differently. The models below are what you need to
read such a file; which tool replaces what is your decision in the exercise.

### Hooks are prototype methods

A lifecycle hook is an ordinary method that Angular calls on the instance. If a base class defines `ngOnInit` and a subclass
defines `ngOnInit` too, JavaScript override rules apply: Angular calls the subclass's method, and the base method runs only
if the subclass calls `super.ngOnInit()`.

That call is easy to forget because nothing reminds you. TypeScript's `override` keyword only checks that the base has a
method of that name; it does not require calling it. Neither the compiler nor Angular warns, and the base class's work just
stops happening for that one subclass.

```tree
ShelfWidgetBase (defines ngOnInit, ngOnDestroy)
  NewArrivals (no hooks of its own)
  ReturnsDesk (defines ngOnInit)
  ReadingList (defines ngOnDestroy)
```

Composition removes the question: an injected service, `inject(DestroyRef)` in the class that owns the resource, or a host
directive. The tradeoff is not "inheritance is wrong". An abstract base class that only shares types or pure helpers is
harmless; a base class that relies on its hooks running is a contract every subclass can break silently.

### Angular ignores the promise a hook returns

Angular calls `ngOnInit()` and does nothing with its return value. With `async`, the hook returns at the first `await`, and
the first render uses whatever the fields hold at that moment. If the template dereferences a field that is only assigned
after the `await`, the first render throws. A rejected promise goes nowhere Angular's template can see: in this app
`provideBrowserGlobalErrorListeners()` forwards the unhandled rejection to the `ErrorHandler`, which logs it, and the screen
still never learns that loading failed.

Async state needs a representation for "not yet" and "failed". You already have several: `toSignal` with an `initialValue`,
a resource, or a subscription that you clean up with `DestroyRef`. Note that a resource's loader does not run synchronously
when the resource is created; it starts when the resource's internal effect first runs, during change detection.

### Derive before you copy

```ts
readonly member = input.required<Member>();
readonly greeting = signal('');

constructor() {
  effect(() => this.greeting.set(`Welcome back, ${this.member().name}`));
}
```

A component effect runs during change detection, after the component's hooks and before its template is refreshed. Anything
that reads the copy earlier sees the old value: `ngOnChanges`, imperative code right after the input was set, or a test that
reads it before `detectChanges()`. The Angular guidance is direct: do not use `effect` to propagate state from one signal to
another. A value derived from other signals is a `computed`, or a `linkedSignal` when it must also be writable, and both are
current whenever they are read.

### Run once, or re-run on change

`afterNextRender` describes one render. `afterRenderEffect` re-runs after a render whenever the signals it read changed. The
question for any measurement or DOM sync is whether what it depends on can change after the first render. If it can, a
one-shot hook gives you a value that was correct once.

> [!WARNING]
> An `afterRenderEffect`, `effect` or `computed` only tracks the signals it actually reads on that run. A read hidden behind
> an early `return` or an `?.` that short-circuits is not tracked, so a change to that signal will not re-run it.

### Review questions

- When a subclass defines a hook, does the base class's version of that hook still run? Who would notice if it did not?
- What does the template show before an `await` in a hook completes, and where does a rejection end up?
- For each piece of local state, where does its value come from, and when is it current?
- Which DOM work runs once, and can what it depends on change afterwards?
- What does the base class give each widget, and what does each widget have to remember to keep it working?

**Now do exercise 03.**

---

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write the
two-sentence PR comment you would leave for the author. If you cannot write it without looking, reread the chapter.
