# Memory: a lesson before the exercises

Memory bugs are the ones a test suite rarely catches and a user always does, an hour into a session, as a tab that gets slower
for no visible reason. You fixed some in v17 with `takeUntil(this.destroy$)` and `ngOnDestroy`. The causes have not changed:
something long-lived keeps a reference to something short-lived. What changed is how Angular helps you avoid them, and how much
of the work you still do by hand. This lesson also teaches you to see a leak in Chrome DevTools, because some of them can only
be confirmed there.

How to use this lesson:

- Read one chapter, then do its exercise. Each chapter assumes you finished the previous exercise.
- The examples live in a library (books, members, loans, shelves) and use different resources from the exercises on purpose.
  You learn each mechanism here and decide where it applies there.
- Each chapter ends with review questions. Ask them while you read the exercise code.
- `GUIDE.md` in this folder is the step-by-step profiling guide, with the exact DevTools panels and what to look for in each
  exercise. This lesson teaches the model behind it; keep the guide open next to the exercises.

## Chapter 0: what moved since Angular 17

### What did not move: reachability

The garbage collector frees an object when nothing reachable points to it. Reachable means there is a chain of references from
a root: `window`, `document`, the list of active timers, the root injector, module-level variables. A destroyed component that
is still at the end of such a chain stays in memory, with its view, its DOM nodes and everything they reference. Every leak in
this topic has that shape. Every fix cuts the chain at the link closest to the root.

### When a leak matters

A leak costs roughly the retained size of one occurrence, times the occurrences per session, times the length of the session,
measured against the memory the device can spare. Two kilobytes per route change on a page people reload every few minutes is
noise. The same two kilobytes on a staff terminal at the circulation desk that stays open all day, eight hours of route changes,
ends in a crashed tab. A leak that retains a whole view, with its DOM and its data, matters even in short sessions.

### When you do not need cleanup

Cleanup is for references that point from something long-lived to something short-lived. A listener on an element inside the
component's own view, or an object that only the component references, is collected together with the component: nothing
outside holds it. A leak exists only when the target outlives the listener. Before you add cleanup code, ask what holds the
thing you are about to clean up.

### What moved

- Zone.js is gone (zoneless is the default since v21, and it is not installed here). Zone used to wrap every listener and timer.
  That never prevented leaks, and its absence does not cause them. A leaked listener no longer triggers change detection just
  by firing; it still does if it sets a signal a template reads or calls `markForCheck()`.
- `DestroyRef` and `inject()` let you register cleanup at the point of creation, in the constructor or a field initializer.
  `takeUntilDestroyed()` and `toSignal()` use it to end subscriptions for you.
- The `host` metadata registers `window:` and `document:` listeners that Angular adds and removes with the component.
- `effect(fn)` re-runs when its signals change and gives you `onCleanup` for whatever one run set up.
- `afterNextRender` and `afterEveryRender` (named `afterRender` before v20) run code after rendering, in the browser only, and
  accept phases that separate DOM reads from DOM writes.
- `computed` caches derived values. With `OnPush` as the default strategy, a view re-renders when a signal it reads changes, and
  any plain method called from that template runs again with it.

## Chapter 1: everything you start has a handle (exercise 01)

### The problem

A member reads a long book in the reading-room view, closes it, opens another. The browser does not know the view closed. Every
browser API that keeps calling you back (listeners, timers, observers, channels) is owned by the browser, and the browser keeps
your callback, and everything the callback can reach, until you tell it to stop.

```flow
browser -> ResizeObserver: keeps alive while it observes
ResizeObserver -> callback: holds
callback -> ReadingRoom instance: closes over this
ReadingRoom instance -> its view and DOM nodes: references
```

Angular destroying `ReadingRoom` removes it from the view tree. It does nothing to the observer, so the chain from the browser to
the component is intact, and the garbage collector keeps all of it.

### Every start returns a handle

Each API that starts something gives you a way to stop it. Reviewing for leaks is mostly finding the handle and checking that
someone uses it:

| Started with | Handle | Stopped with |
|---|---|---|
| `new ResizeObserver(cb)` / `IntersectionObserver` | The observer | `disconnect()` |
| `new BroadcastChannel(name)`, `new WebSocket(url)` | The channel | `close()` |
| `target.addEventListener(type, fn)` | The `fn` object itself | `removeEventListener(type, fn)` with the same object |
| `setInterval(fn, ms)` / `setTimeout` | The returned id | `clearInterval(id)` / `clearTimeout(id)` |
| `obs$.subscribe(...)` | The `Subscription` | `unsubscribe()` |
| APIs that return a function (`Renderer2.listen`, `DestroyRef.onDestroy`) | That function | Calling it |

And the ways to not hold any handle yourself:

| Declarative form | Who stops it |
|---|---|
| `host: { '(window:scroll)': 'track()' }` | Angular, when the component is destroyed |
| `(click)="borrow()"` in the template | Angular, with the element |
| `toSignal(obs$)`, `takeUntilDestroyed()` | Angular, through `DestroyRef` |

Here is the pattern with an observer that keeps a reading column at a comfortable width:

```ts
export class ReadingRoom {
  private readonly page = viewChild.required<ElementRef<HTMLElement>>('page');
  protected readonly columns = signal(1);

  constructor() {
    let observer: ResizeObserver | undefined;

    afterNextRender(() => {
      observer = new ResizeObserver(([entry]) =>
        this.columns.set(entry.contentRect.width > 900 ? 2 : 1),
      );
      observer.observe(this.page().nativeElement);
    });

    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}
```

The observer is a browser API, so it is created in `afterNextRender`, which never runs on the server. Its handle is stopped in the
same constructor. A reviewer reads the constructor top to bottom and sees the start next to the stop.

### Seeing it: the Performance monitor

Some leaks are easy to test (create and destroy a component, count what is left). All of them are visible:

1. In DevTools, open the Command menu (`Cmd+Shift+P` or `Ctrl+Shift+P`), run "Show Performance monitor".
2. Watch "JS event listeners", "DOM Nodes" and "JavaScript heap size".
3. Visit the page once and leave it as a warm-up, so one-off lazy loading is out of the way. Then visit and leave ten times.

A healthy page comes back to the same numbers. A counter that grows by a fixed amount on every visit is a leak, and the amount
tells you how much each visit leaves behind. The heap size moves in a sawtooth because of garbage collection; read its floor, not
its peaks, and force a collection (the trash-can button in the Memory panel) before you compare.

> [!WARNING]
> DevTools can create the leak you are measuring. An object you logged with `console.log`, expanded in the console, or selected
> as `$0` stays retained by DevTools itself. Browser extensions, Angular DevTools included, add their own objects and listeners.
> Profile in an incognito window or a clean profile, and clear the console before you compare.

### Review questions

- What does the browser hold on this component's behalf after it is destroyed?
- For each thing started here: what is its handle, and where is the handle used?
- After ten visits, how many of each resource are alive?
- Does the target of each callback outlive the component, or die with it?

**Now do exercise 01.**

## Chapter 2: long-lived objects that point to short-lived ones (exercise 02)

### The problem

The circulation desk shows a list of loans, and a root service sends reminders to every row on screen. The desk stays open all
day; rows come and go hundreds of times. A service with `providedIn: 'root'` lives as long as the application. A component lives
as long as it is on screen. When the service keeps a reference to the component, in an array, a `Map` or a `Set`, the
component's lifetime becomes the service's:

```flow
root injector -> ReturnReminders service: records
ReturnReminders service -> Map entry: holds in rows
Map entry -> LoanRow instance: value
LoanRow instance -> its view and DOM nodes: references
```

A registry is a reasonable design. It has one rule: whoever adds an entry owns its removal, and the removal happens when the
entry's owner goes away. A good registry API makes that removal hard to forget, the way `subscribe` hands back a `Subscription`
and `addEventListener` pairs with `removeEventListener`.

There is a second symptom besides memory: a service that still holds destroyed components keeps calling them. Writing to a
signal of a component nobody can see is wasted work at best, and at worst a bug report about something that "changes by
itself".

### Caches: a trade of memory for latency

A cache is a registry whose keys come from data. It spends memory to save time, and two questions decide whether the trade
holds:

1. What is the key's domain? Book ids are bounded by the catalog, but bounded is not small: a catalog of two million books is
   two million possible entries. Search terms typed by a user are not bounded at all, since every distinct string is a new key.
2. What is the value? Data (a string, a plain object) costs its own size. A DOM element or a component instance costs
   everything it references. An element removed from the page but still referenced from a cache is a detached DOM node: not in
   the document, still in memory, along with its listeners and whatever its closures hold.

Sizing a cache is a measurement. Count the hit rate, size the cache for the working set (the keys people actually reuse within
a session), and pick an eviction rule from how values go stale: least recently used when old entries stay correct but get
cold, a time to live when entries become wrong after a while. Sometimes the answer is no cache at all, when recomputing is
cheaper than the memory. `Map` keeps keys in insertion order, which is useful when you write eviction yourself.

### `WeakMap` and `WeakRef`

Both hold an object without keeping it alive.

| Tool | Right when | Limits |
|---|---|---|
| `WeakMap<object, V>` | The key is an object whose lifetime you do not control, and the value should die with it (per-instance metadata) | Keys must be objects, not strings. You cannot iterate it or ask its size. |
| `WeakRef<T>` | You want to use an object if it still exists, and you accept that it may not | `deref()` can return `undefined` at any time. Collection timing is up to the engine. |

They are tempting as a fix for a registry, and they usually hide the problem. A destroyed component referenced weakly is still
called until the collector happens to run, which might be never in a short test. When the lifetime is known (the component
knows when it is destroyed), say it explicitly.

### Seeing it: heap snapshots and retainers

The Performance monitor tells you that memory grows. A heap snapshot tells you what grows and who holds it. Taking a snapshot
forces a garbage collection first, so what you see is what is really retained.

1. Do the suspect action once as a warm-up. Take snapshot 1 (the baseline).
2. Repeat the action N times (show and hide a list ten times, type ten different searches). Take snapshot 2.
3. Repeat it N more times. Take snapshot 3.
4. Compare 2 with 1 and 3 with 2 ("Comparison" view, sort by "# Delta"). A class that grows by the same amount in both steps is
   a leak. Growth only in the first step is usually a cache filling up or lazy setup.
5. Filter by class name (Angular keeps class names in dev builds), select one instance, and read the "Retainers" pane. The first
   row is the object's direct holder, and each level below it is one step closer to a root. The first holder that does not
   belong to the component is the link to cut.
6. For DOM, type `Detached` in the class filter. Expand a detached tree and read its retainers the same way.

```tree
Retainers of LoanRow @81423
  value in Map entry [rows]
    rows in ReturnReminders [root service]
      ReturnReminders in R3Injector records [root injector, alive as long as the app]
```

"Shallow size" is the object alone; "Retained size" is what would be freed with it. A small component with a huge retained size
is holding its whole view.

> [!NOTE]
> A leak and churn are different problems. Churn is memory that is freed correctly but allocated so fast that garbage
> collection runs constantly and the page stutters. Snapshots will look clean. "Allocation sampling" in the Memory panel shows
> who allocates the most; use it when the heap's sawtooth is steep but its floor is flat.

> [!IMPORTANT]
> A unit test can count registry entries or cache size, but it cannot tell you that the collector frees a component. The heap
> snapshot is the proof.

### Review questions

- For each collection in a root service: who adds entries, who removes them, and when?
- Does anything call methods on objects that may already be destroyed?
- What is the domain of each cache key? What happens when the user produces the ten-thousandth distinct key?
- What does each cache entry hold: data, or something that references the DOM?
- Would a weak reference here express the lifetime, or hide it?

**Now do exercise 02.**

## Chapter 3: effects, template calls and layout (exercise 03)

### The problem

The branch dashboard shows a third-party map of shelves, a few statistics and a search box. Librarians say it gets slower the
longer it is open, and that typing in the search box stutters. Three different costs tend to show up in the same profile:
objects created more often than they should be, work repeated for nothing, and layout computed more often than needed.

### An imperative object has three lifetimes

Third-party widgets (charts, maps, editors) are imperative. They typically expose a setup step that runs once and usually adds
its own listeners and animation loops, an update step that runs many times, and a teardown step that runs once. Each step has a
run count, and each Angular hook has a run count:

| Angular tool | How many times it runs |
|---|---|
| `afterNextRender` | Once, after the first render, in the browser |
| `afterEveryRender` | After every render |
| `effect` | Once, then again every time a signal it read changes |
| `DestroyRef.onDestroy` | Once, when the owner is destroyed |
| `computed` | When read, and only if a signal it read changed |

The principle: match each step of the widget to a hook whose run count equals the step's run count.

The effect semantics you need for that: every run of an effect starts from scratch, and `onCleanup` is where you take down what
one run set up, before the next run and on destroy. Here it closes a channel to the branch the librarian is viewing, before
opening the next one:

```ts
effect((onCleanup) => {
  const channel = new BroadcastChannel(`branch-${this.branchId()}`);
  channel.onmessage = (event) => this.events.update((list) => [...list, event.data]);
  onCleanup(() => channel.close());
});
```

### A template method runs on every render of its view

```ts
template: `
  <input (input)="term.set($any($event.target).value)" />
  <p>{{ overdueSummary() }}</p>
`
protected overdueSummary() {
  return summarize(this.loans());   // runs on every render of this view
}
```

When the user types, `term` changes, the view renders again, and `overdueSummary()` runs again, although `loans` did not
change. For a cheap expression that is fine. For anything expensive (a sort, a statistic over hundreds of points, a nested loop)
it is a long task on every keystroke. A `computed` runs its function once, caches the result, and runs again only when a signal
it read changes:

```ts
protected readonly overdueSummary = computed(() => summarize(this.loans()));
```

Typing in the search box is now much cheaper, though not free: the view still renders. If the computation itself still takes
more than 50 ms when the data does change, the next decision is to move it off the main thread (a Web Worker) or to split it
into chunks that yield between them.

### Reading layout after writing styles

Reading a layout property (`offsetHeight`, `offsetWidth`, `getBoundingClientRect()`) makes the browser apply every pending
style change and compute layout before it can answer. One read is fine. Alternating writes and reads in a loop forces one full
layout per iteration. That is layout thrashing. Here it is, positioning a column of shelf tooltips under each other:

```ts
let top = 0;
for (const tip of tooltips) {
  tip.style.top = `${top}px`;                      // write
  top = tip.getBoundingClientRect().bottom + 4;    // read: forces layout, every iteration
}
```

The rule is to batch: all reads first, then all writes. The render hooks make the batching explicit with phases that run in a
fixed order across all components: `earlyRead`, `write`, `mixedReadWrite`, `read`. Each phase receives the result of the
previous one. The Angular docs ask you to prefer `write` and `read` over the other two:

```ts
afterNextRender({
  write: () => {
    this.shelfList().nativeElement.scrollTop = this.savedScroll; // DOM write
  },
  read: () => {
    this.analytics.record('shelf-list-height', this.shelfList().nativeElement.scrollHeight); // DOM read
  },
});
```

> [!NOTE]
> Setting a signal that a template reads, from inside a render hook, schedules another render. Once, in `afterNextRender`, that
> is fine. In `afterEveryRender` it can become a loop that never settles.

### Seeing it: the Performance panel

1. Performance panel, press Record, do the slow interaction, press Stop.
2. In the "Main" track, a task over 50 ms is a long task: it has a red triangle and the part over 50 ms is shaded red.
3. Click it. "Bottom-up" shows which functions took the most time in total; "Call tree" shows which activity started the work.
4. Many purple "Layout" or "Recalculate style" entries inside one task, each started by your own code, are layout thrashing.
   Recent Chrome versions also flag them with a "Forced reflow" insight or a warning on the Layout event.
5. To count widgets or loops, watch "JS event listeners" in the Performance monitor while you trigger the update, and look for
   several `requestAnimationFrame` callbacks per frame in the recording.

```flow
keystroke -> signal set: term
signal set -> view render: the template reads term
view render -> template method: called again
template method -> long task: same inputs, same result, full cost
```

### Review questions

- For each imperative object: how many times is it set up, updated and torn down, compared with how many times it should be?
- If an effect's first run happens before the object it uses exists, which signals did that run read?
- If this view renders 30 times a second, what runs 30 times?
- How many times does the browser compute layout during this method?
- Which of these problems can a unit test prove, and which need a recording?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then repeat the
measurement from the chapter with the fix applied: the counters must stay flat and the class must stop growing in the
comparison view. Finally write, in two sentences, the comment you would leave on the pull request.

> [!WARNING]
> One trap to check in your own fix: an effect only tracks signals it actually read during its last run.
> `effect(() => this.map?.setPins(this.pins()))` looks like it depends on `pins`, but while `this.map` is `undefined`, optional
> chaining skips the call and never evaluates its argument. `pins()` is never read, no dependency is recorded, and the effect
> never runs again. Read the signals first, then use them.
