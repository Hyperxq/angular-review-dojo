# Performance: a lesson before the exercises

In a v17 app, performance work meant `trackBy` functions, `ChangeDetectionStrategy.OnPush` sprinkled on hot components,
`runOutsideAngular` for scroll handlers, and lazy-loaded `NgModule`s. Most of that vocabulary still applies, but the
defaults moved under it.

Users feel performance as three things: how long the first screen takes, how fast the page answers a click, and whether the
screen shows the truth. This lesson gives you the tools to measure each one and the Angular mechanisms behind them, one
chapter per exercise, in the same order.

How to use it:

- Read one chapter, then do its exercise. Each chapter assumes the previous exercise is done.
- The examples use a different domain on purpose: a library with books, members, loans and shelves. The lesson gives you the
  pieces, and the exercise makes you find where they are missing and put them together yourself.
- Every chapter ends with review questions. Ask them out loud while you read the exercise code.
- Some performance problems give the right result slowly, or give it in a bigger bundle. A unit test cannot see those, so
  each chapter says how to observe its problems with the browser's tools.

---

## Chapter 0: what moved since Angular 17

### First principle: measure before and after

A performance fix you did not measure is a guess. Before you change anything, write down the symptom, who feels it, and a
number: milliseconds for a click, kilobytes for a bundle, a Lighthouse metric for a page load. After the change, take the
same measurement the same way. If the number did not move, the change was not the fix, however reasonable it looked.

### Numbers worth knowing

- A frame at 60 Hz lasts about 16 ms. Work longer than that in one go makes scrolling and animations stutter.
- Interaction to Next Paint (INP) measures the delay between a click, tap or key press and the next frame the user sees.
  It is the metric behind "the click freezes the page". Google's Core Web Vitals call an INP of 200 ms or less good.
- Largest Contentful Paint (LCP) measures when the biggest element of the first screen has rendered. Cumulative Layout Shift
  (CLS) measures how much the page jumps while it loads. Chapters 3 and 4 use both.

### How to measure honestly

- Profile a production build. `ng build` uses the production configuration by default, and `ng serve --configuration
  production` serves one. Development mode runs extra work on purpose, such as the `checkNoChanges` pass after every change
  detection, so its timings are inflated.
- Your laptop is faster than your users' phones. In the Performance panel, throttle the CPU (4x is a common setting), or
  test on a real mid-range device.
- Lab data (Lighthouse, a profile you record) is repeatable and explains causes. Field data (the Chrome UX Report, or a
  real-user monitoring tool) tells you what real visitors experience. A lab win that never shows in the field did not matter
  to anyone.
- `enableProfiling()` from `@angular/core` adds an Angular track to the Chrome Performance panel, showing change detection
  and component work next to the browser's own timeline. It only works in development mode (it is a no-op in production), so
  use it to find which components work, and a production build to time them.
- The Angular DevTools browser extension has a profiler that records each change detection run, which components were
  checked, and how long each took.

### Who triggers a render

In v17, Zone.js patched almost every async browser API. When any callback finished, Angular ran change detection over the tree,
needed or not. Performance work was about stopping it: OnPush, `runOutsideAngular`, detaching change detectors.

This app is zoneless. `zone.js` is not installed, and since v21 zoneless is Angular's default, with nothing to configure.
Angular now schedules a render only when something it understands says that a view changed:

- a signal read by a template changes,
- a template or host event listener of that view (or of a view inside it) runs,
- an `async` pipe receives a value,
- `ComponentRef.setInput()` sets an input (the router and `TestBed` use it),
- someone calls `markForCheck()`.

Everything else, such as a `setTimeout`, a `window.addEventListener` callback, a resolved promise, or a WebSocket
message, changes data without telling anyone. Chapter 3 is about that.

### OnPush is the default

In v22 `ChangeDetectionStrategy.OnPush` is the default; the old behaviour is called `Eager` (`Default` is a deprecated
alias). An OnPush view is checked when its inputs change by reference, when an event fires inside it, when a signal it reads
changes, or when it is marked for check. You no longer add OnPush to make a component fast, so the questions shift to "does
the component get told when its data changes?" and "how much work does each check do?".

### Signals carry the change

```ts
const loans = signal<Loan[]>([]);                               // state
const overdue = computed(() => loans().filter(isOverdue));      // derived, lazy, memoized
effect(() => localStorage.setItem('loans', JSON.stringify(loans()))); // side effect
```

A `computed` runs only when something reads it and one of its dependencies changed since the last run. A template that reads
`overdue()` ten times per check costs one filter, not ten.

Two more appear later: `untracked` (read a signal without depending on it) and `linkedSignal` (new in v19, a derived value
that can also be written).

### New template syntax, new defaults

- `@for` replaced `*ngFor` (deprecated since v20), and its `track` expression is mandatory: leaving it out is a compile error
  (`@for loop must have a "track" expression`). The choice of key is yours to get right, and Chapter 1 is about it.
- `@defer` (new in v17, stable since v18) lazy-loads a piece of a template. Chapter 4 covers it.

### The build tells you what you ship

The application builder (`@angular/build`, esbuild based) prints two tables after `ng build`: "Initial chunk files" (what
every visitor downloads before the first screen) and "Lazy chunk files" (what is fetched later). `ng build --stats-json`
writes a `stats.json` you can drop into the esbuild bundle analyzer (https://esbuild.github.io/analyze/) to see which
module pulled which into a chunk. The `budgets` in `angular.json` warn when the initial bundle grows past a limit (500 kB
here).

---

## Chapter 1: identity in lists, and work in templates (exercise 01)

### The symptom

A clerk enters orders all day in a table they type into while its rows change under them. Whether that table is fast and
whether it is correct depend on one mechanism: how Angular decides which DOM node belongs to which item. Get it wrong and
the page does more DOM work than it needs to, and in a table people type into it can also send a wrong order to a customer.
That is why identity sits in a performance lesson.

The same page may also feel slow when you click. Before you move any code for that, measure it.

### How to observe it

Select a row in the Elements panel, so the console knows it as `$0`. Do the action (sort, filter, refresh), then run
`$0.isConnected` in the console. `true` means Angular kept that node; `false` means it destroyed it and created a new one.
The Elements panel also flashes nodes as they change, but it flashes updated text as well as recreated nodes, so the flash
alone does not prove a row was rebuilt.

For slowness, record the click in the Performance panel (CPU throttled, production build) and read its INP and the long tasks
under it. In dev mode, `enableProfiling()` labels which component's check took the time.

### What `track` decides

When the array behind an `@for` changes, Angular has to decide, for each new item, whether it is "the same row as before"
(keep its DOM node, update its bindings) or a new row (create a node). `track` is the answer to "same according to what?".

Some state lives only in the DOM, outside your data: the text a user typed into an `<input>` you did not bind, focus, text
selection, scroll position, a running CSS animation. That state stays with the DOM node, wherever Angular decides the node
belongs.

| `track` | "Same row" means | Fits | Goes wrong when |
|---------|------------------|------|-----------------|
| `track book.id` | same business key | almost every list | keys are not unique |
| `track $index` | same position | static lists that never reorder or filter, with no DOM state | items move: each node keeps its DOM state but shows another item |
| `track book` | same object reference | lists whose objects are kept and reused | the list is rebuilt with fresh copies: every row looks new, so every node is destroyed and created again |

A short example with members on a waiting list:

```html
@for (member of queue(); track member.id) {
  <li>
    {{ member.name }}
    <input [attr.aria-label]="'Note for ' + member.name" />
  </li>
}
```

Move a member to the front of the queue and their `<li>`, input text included, moves with them, because Angular matched the
node by `id`.

> [!NOTE]
> In dev mode Angular warns when tracking by identity recreated the whole collection: `NG0956: The configured tracking
> expression (track by identity) caused re-creation of the entire collection`. Keep the console open while you click
> around.

### When template expressions run

Everything inside `{{ }}` and `[binding]="..."` is evaluated each time Angular checks the view. In a zoneless OnPush app a
view is checked when a signal it reads changes, when it is marked for check, and when an event listener fires in it or in
any view inside it: a listener marks its own view and every ancestor up to the root as dirty. So a click deep in a child
component re-runs the expressions of its parent and grandparents too.

### When a template call is a problem

The cost of an expression is roughly the cost of one call, times the number of rows, times the number of checks per
interaction. Compare that with the frame budget (about 16 ms) and the INP target (200 ms or less):

| Case | Per call | Rows | Checks per click | Cost per click | Verdict |
|------|----------|------|------------------|----------------|---------|
| `isOverdue(loan)` comparing two dates | ~2 µs | 12 | 1 | ~0.02 ms | irrelevant, leave it |
| `formatFine(loan)` with `Intl.NumberFormat` created each call | ~50 µs | 500 | 2 | ~50 ms | visible on a slow phone |
| a fee rule that walks the loan history | ~1 ms | 200 | 1 | ~200 ms | the whole INP budget |

The numbers are illustrations; yours come from the profiler. A template call is fine when it is cheap and the list is
short: a property read, a comparison, a signal call, a small formatting helper. When the profile shows it, move the
derivation into a `computed`:

```ts
protected readonly feeRows = computed(() =>
  this.loans().map((loan) => ({ loan, fee: this.fines.feeFor(loan) })),
);
```

`feeRows` runs again only when `loans()` changes, however many checks happen in between. A `computed` has costs too: this
one allocates a wrapper object per row and keeps the whole array in memory, and it recalculates every row when any loan
changes. For twelve rows that is free; for ten thousand, measure it.

Several `computed` can depend on each other, and each recalculates only when its own inputs change. A `loansForMember`
`computed` that filters `this.loans()` by `this.selectedMember()` recalculates when either changes, while one that reads
only `this.loans()` is untouched by a change of member.

A pure pipe is the other way to memoize in a template: Angular calls `transform` again only when an argument changes by
reference. It suits formatting shared across components, while a `computed` keeps the derivation next to its data.

### Review questions

- Sort, filter and refresh each list. Which DOM nodes survive (`$0.isConnected`), and does the DOM state in each row stay
  with the right item?
- For each `@for`: what does its `track` key identify?
- Which template expressions call a function? How long does one call take, times how many rows, times how many checks per
  click?
- What would you measure, on what device, to show this matters?

**Now do exercise 01.**

---

## Chapter 2: references, OnPush inputs, and derived state (exercise 02)

### The symptom

A member adds a book to a reading list. The list shows it, but the counter next to it still says the old number until the
member clicks something else. The screen is showing something that is not true, and the member who trusts it acts on
wrong information.

### How to observe it

Open Angular DevTools, select the component that is out of date, and look at its inputs and signals. If the data inside is
new but the component did not re-render, ask how it was supposed to learn about the change. The profiler shows whether that
component was checked at all during the click.

### A signal notifies on a new value

A signal compares the old and new value with `Object.is` (you can pass a different `equal` function). Its consumers are told
"I changed" only when you call `set` or `update` and the comparison says the value is different.

| Code | Consumers notified? |
|------|---------------------|
| `shelf.set({ ...shelf(), books: [...shelf().books, book] })` | yes, new reference |
| `shelf.update((s) => ({ ...s, label }))` | yes, new reference |
| `shelf.set(shelf())` | no, same reference |
| `shelf().books.push(book)` | no, the signal was never set |

The last row is the dangerous one. The data really did change, so anything that happens to re-render for another reason
shows it, and anything that relies on the signal to tell it does not. The screen ends up half updated.

### OnPush inputs compare references too

A parent that passes an object to an OnPush child re-evaluates `[shelf]="shelf()"` on its own check. If the expression
returns the same reference as last time, the child's input did not change and the child is not checked.

```tree
ShelfPage
  BookList [OnPush]
  ShelfStats [OnPush]
```

When `ShelfPage` is checked because of a click inside it, its own template is refreshed. Each child refreshes only if its
input reference changed, or one of its own signals changed. Two children fed the same object can disagree on screen when one
of them is refreshed for another reason.

So with signals and OnPush, immutable updates are how the framework learns about the change. Spread, `map`, `filter` and
`concat` give you new references; `push`, `splice`, `sort` (in place) and property assignment do not.

### Count the work per check

Chapter 1 showed that a template expression runs on every check. Work hides in places the template does not show: a getter
looks like a property but runs its body on every read.

```ts
get overdueBooks() {
  return this.loans().filter(isOverdue);   // runs on every read
}
```

```html
<p>{{ overdueBooks.length }} overdue</p>
@for (loan of overdueBooks; track loan.id) { ... }
```

That template filters the list twice per check. Count every read of a getter and every call of a method in the template,
including calls that a method makes to other methods, and apply the cost reasoning from Chapter 1 before you change it.

### `computed` for derived state, `effect` to leave the graph

```ts
// derived state copied by an effect
readonly heading = signal('');
constructor() {
  effect(() => this.heading.set(`${this.shelf().label} (${this.shelf().room})`));
}

// the same value, derived
readonly heading = computed(() => `${this.shelf().label} (${this.shelf().room})`);
```

The effect version costs more and is easier to break:

- the value is copied in a separate step that Angular has to schedule, instead of being computed at the moment it is read;
- there is a second writable signal that something else could set to a wrong value;
- the effect runs even when nobody reads `heading`, while a `computed` is lazy.

An effect whose only job is to call `set` on another signal is a `computed` waiting to happen (or a `linkedSignal`, when the
derived value must also accept writes, like a selection that resets when its list changes). Keep `effect` for work that
leaves the reactive graph: `localStorage`, logging, analytics, an imperative chart or map library.

### Review questions

- For each signal holding an object or array: is it ever changed in place instead of being set to a new value?
- For each OnPush child: when its parent's state changes, does the child receive a new reference?
- How many times does each expensive function or getter run for one check of the template, counting calls from other methods?
- For each `effect`, what does it write to, and could the value be derived at read time?
- What would you measure, on what device, to show this matters?

**Now do exercise 02.**

---

## Chapter 3: zoneless rendering, browser events, images and effect dependencies (exercise 03)

### The symptom

Status lines and counters tell users about things that change without them, such as a queue length or a message pushed
from the server. Users read them and act on them. In a zoneless app, whether the screen keeps up depends on who tells
Angular that something changed, and when the screen falls behind, people act on stale information with no sign that it is
stale.

### How to observe it

- In dev mode, `provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })` (developer preview since 20.0) checks every
  view as if it were `Eager`, every second, and reports bindings whose value changed without Angular being told. It is the
  most direct detector for zoneless-unsafe state. Add it to a local dev setup, never ship it.
- The Angular DevTools profiler shows whether a change detection ran at all when your timer, observer or message fired.
- The Elements panel's "Event Listeners" tab shows what is attached to `window` and `document`. Navigate to the page and away
  a few times and count.

### Plain fields and callbacks

Look again at the list in Chapter 0 of what schedules a render. Then look at a callback that comes from outside Angular:

```ts
export class ShelfGrid {
  protected columns = 2;

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    new ResizeObserver(([entry]) => {
      this.columns = Math.floor(entry.contentRect.width / 240);
    }).observe(host);
  }
}
```

Default Zone.js does not patch `ResizeObserver` (that takes an opt-in plugin), so this was a bug before too. Zoneless, the field
changes and nothing renders it until some unrelated event happens to check this view. The rule for zoneless code: state the
template reads must be a signal, or the code that changes it must go through one of the notifiers in Chapter 0.

The same rule applies to a WebSocket `onmessage`, a third-party SDK callback, a `requestAnimationFrame` loop, or a
`setTimeout`. It is the most common bug when porting older code to zoneless, because in older code the plain field "worked"
for years.

### Getting a callback into Angular

| Option | Fits | Cleanup |
|--------|------|---------|
| set a signal from the callback | any callback you own | remove the source in `DestroyRef.onDestroy` |
| `host: { '(document:keydown.escape)': 'close()' }` | DOM events on `window`, `document`, `body` or the host | the framework adds and removes it with the component, and marks the view for check |
| `toSignal(fromEvent(target, 'name'))` | events you also want to debounce or combine with RxJS | unsubscribed when the owner is destroyed |
| `markForCheck()` | legacy code you cannot convert yet | none, and it is easy to forget a path |

### Listeners have owners

`addEventListener` on `window`, `document` or a long-lived object adds a listener that belongs to that object, not to the
component. When the component is destroyed, the listener stays, and its closure keeps the dead component in memory. Each new
instance adds another one. For every listener, observer, timer or subscription, ask who removes it, and when.

### The LCP image

The symptom: Lighthouse names a large image as the LCP element and the page feels slow to "arrive". A plain `<img>` is
discovered and prioritized by the browser like any other image, which can be late.

To observe it, run Lighthouse on the page, or record a page load in the Performance panel and look at the LCP marker: it
names the element and its timing. The Network panel's "Priority" column shows whether the image was fetched as High.

`NgOptimizedImage` (from `@angular/common`, add it to `imports`) takes over the `<img>` when you use `ngSrc` instead of
`src`:

```html
<img ngSrc="reading-room.jpg" alt="The main reading room" width="1600" height="700" priority />
```

- `width` and `height` are required (or `fill`), so the browser reserves space and the layout does not shift.
- Images are `loading="lazy"` by default. `priority` marks the LCP image instead: it gets `fetchpriority="high"` and
  `loading="eager"`. The directive's docs warn against setting `loading="eager"` yourself, because that marks the image as
  non-priority.
- In dev mode it reports an LCP image that is not marked: `NG02955 ... this image is the Largest Contentful Paint (LCP)
  element but was not marked "priority"`. That check only covers images that already use `ngSrc`.

Use `priority` on one or two images per page: the ones that can be the LCP element on common screen sizes. Marking every
image high priority makes them compete for bandwidth, and the real LCP image arrives no sooner.

### What an effect depends on

An `effect` (and a `computed`) depends on every signal it reads while it runs, wherever the read happens: in a condition, in
a variable, or inside a function it calls, including functions in other services that you never opened. When any of them
changes, it runs again.

`untracked` reads a signal without creating that dependency. Here, a due-date label should change when the loan changes, and
the team decided a change of display locale may wait for the next one:

```ts
readonly dueLabel = computed(() => {
  const due = this.loan().dueDate;               // tracked
  const locale = untracked(this.settings.locale); // read, not tracked
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(due);
});
```

The tradeoff is explicit: if the locale changes, `dueLabel` stays in the old locale until `loan` changes. Use `untracked`
when a read is context for the work, and the work should not be repeated just because that context changed.

### Review questions

- Change the data from outside Angular (resize, a server message, a timer firing). Does the screen follow without a click?
- For every listener, timer or observer: who removes it, and when?
- Which image is the largest thing on the first screen? Does the browser fetch it as High priority?
- For each `effect`: list every signal it reads, directly or through the functions it calls. Which of those reads should be
  allowed to re-run it?
- What would you measure, on what device, to show this matters?

**Now do exercise 03.**

---

## Chapter 4: what goes in the first bundle (exercise 04)

### The symptom

Every kilobyte of JavaScript in the initial bundle costs a visitor on a mid-range phone over 4G three times: the download,
then the parse and compile, which block the main thread, and then the execution. The first screen and its LCP arrive later,
taps during that time feel dead, and visitors on metered plans pay for code they never use. The cost falls on exactly the
people with the slowest devices.

### How to observe it

No unit test sees a bundle. Use the build:

1. Run `ng build` and read the "Initial chunk files" and "Lazy chunk files" tables. A page or helper you expected to be lazy
   should have its own lazy chunk.
2. Run `ng build --stats-json`, open the generated `stats.json` in https://esbuild.github.io/analyze/, and look for the module
   in question: the analyzer shows which chunk it is in and which import brought it there.
3. In the browser, open the Network panel filtered to JS, reload, and check what downloads before you interact. Scroll,
   click, and navigate, and watch the lazy chunks arrive when they should. After the app settles, anything that keeps
   downloading without a click is preloading.
4. Run Lighthouse with mobile throttling for LCP and "Reduce unused JavaScript".

Then decide whether it matters: a 3 kB chunk moved out of the initial bundle will not show in any metric; 200 kB will.

### The import graph is the bundle

The bundler starts at `main.ts` and follows every static `import`. Everything it reaches goes into the initial chunks, the
JavaScript every visitor downloads before the first screen works. A dynamic `import('./file')` is a cut: the bundler puts
that file, and everything only it reaches, into a separate lazy chunk fetched when the `import()` runs.

```tree
main.js [initial]
  app.routes.ts
    catalog.routes.ts
      catalog-page.ts
      shelf-filters.ts
chunk-members.js [lazy]
  members-page.ts
chunk-loan-history.js [lazy]
  loan-history.ts
chunk-receipt-printer.js [lazy]
  receipt-printer.ts
```

One static import is enough to pull a module back into the initial chunk, even if every other path to it is lazy. So the
review question for each file is: who imports it statically, and does that importer belong to the first screen?

### The four tools that cut the graph

| Tool | Splits off | Fetched |
|------|------------|---------|
| `loadComponent: () => import('./x').then((m) => m.Page)` | one routed page | on the first navigation to it |
| `loadChildren: () => import('./x.routes').then((m) => m.ROUTES)` | a group of routes | on the first navigation into the group |
| `@defer` in a template | the components used inside the block | when a trigger fires |
| `await import('./x')` in code | a module used by one action | when the code runs |

`component: Page` on a route needs `Page` when the route file is evaluated, so it is a static import by definition.

A heavy helper that only one button needs is a case for the last row:

```ts
protected async printReceipts() {
  const { renderReceipts } = await import('./receipt-printer');
  this.printed.set(renderReceipts(this.loans()).length);
}
```

### `@defer`

`@defer` splits part of a template into its own chunk and decides when to load and show it. The parts:

| Part | What it does |
|------|--------------|
| `on idle` | load when the browser is idle |
| `on viewport` | load when the block (or its placeholder) scrolls into view |
| `on interaction` / `on hover` | load when the user clicks or hovers the trigger element |
| `on immediate` / `on timer(2s)` | load right after rendering, or after a delay |
| `when condition` | load when an expression becomes truthy |
| `prefetch on ...` / `prefetch when ...` | download the chunk earlier than it is shown |
| `@placeholder (minimum 500ms)` | shown before the trigger; optional minimum display time |
| `@loading (after 100ms; minimum 300ms)` | shown while the chunk downloads; `after` hides it for fast loads, `minimum` avoids a flash |
| `@error` | shown if the download fails |

Triggers can be combined, separated by `;`. With `on viewport`, `on interaction` or `on hover` and no element reference, the
placeholder itself is the trigger element, so it must have exactly one root element.

A worked example: a member page with a long loan history that few people open.

```html
@defer (on interaction) {
  <app-loan-history [member]="member()" />
} @placeholder (minimum 500ms) {
  <button type="button">Show history</button>
}
```

The history component and everything only it imports stay out of the page's chunk until somebody clicks the button.

The states follow each other like this:

```flow
placeholder -> loading: the trigger fires and the chunk is requested
loading -> complete: the chunk arrived, the main content renders
loading -> error: the chunk failed to download
```

Give the placeholder the size of the content that replaces it when the content appears in the page flow. Otherwise
everything below it jumps when the content arrives, and that layout shift counts against CLS.

How the compiler decides: it can move a component into a deferred chunk only when the component is standalone and the
`@defer` blocks of that template are its only uses. Any runtime reference to the class outside the block keeps the static
import. Type annotations do not count, but any other symbol imported in the same `import { ... }` line does.

When not to defer:

- content above the fold: deferring it delays LCP and usually causes a layout shift;
- tiny components: the extra round trip costs more than the bytes saved;
- with server-side rendering, the server renders the `@placeholder`, not the deferred content. For server-rendered content
  that should only become interactive later, look at `hydrate on ...` triggers (incremental hydration) instead.

### Barrels and side effects

An `index.ts` that re-exports a folder (`export * from './...'`) is convenient for imports and dangerous for bundles. Import
one constant from it and the bundler has to include and analyse every module it re-exports. Tree shaking can drop exports nobody uses,
but it must keep any module with top-level side effects: code that runs when the file is evaluated, such as
`registerLocaleData(localeFr)` at the top of a file, or a polyfill that patches a global. A barrel imported from the first
screen can pull the lazy parts of a feature back into the initial chunk.

Import from the file that defines what you need, especially in code that belongs to the first screen.

### Preloading

Lazy chunks make the first load small, but the first visit to a lazy route then waits for its chunk. Preloading downloads lazy
routes in the background after the app has started. `withPreloading(Strategy)` takes a class that implements
`PreloadingStrategy`:

```ts
abstract class PreloadingStrategy {
  abstract preload(route: Route, fn: () => Observable<any>): Observable<any>;
}
```

The router calls `preload` for each lazy route. Calling `fn()` (and returning its observable) downloads the route; returning
`of(null)` skips it. Built in: `NoPreloading` (the default) and `PreloadAllModules`. You can write your own and decide per route,
from `route.path`, `route.data` or the network:

```ts
@Injectable({ providedIn: 'root' })
export class RespectSaveData implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return connection?.saveData ? of(null) : load();
  }
}
```

`navigator.connection` only exists in Chromium-based browsers. Elsewhere `connection` is `undefined`, so this strategy
falls back to preloading everything.

| Strategy | Pro | Con |
|----------|-----|-----|
| none (default) | no extra traffic | the first visit to each lazy route waits for its chunk |
| `PreloadAllModules` | instant navigation, one line | every visitor downloads every route, including ones only a few people open |
| your own, per route | pay for the likely next pages only | someone must keep the decision up to date |

### Review questions

- Which modules are in the initial chunk files? For each one, does the first screen need it?
- For each route: what does the Network panel download on the first navigation to it, and who uses that page?
- For each `@defer` block, or each place that should have one: when does it load, what does the user see before, and does the
  layout move when it arrives?
- How would you prove a deferred block really got its own chunk?
- Does any import go through a barrel? What else does that barrel bring along?
- Which routes get preloaded, for whom, and on what kind of connection?
- What would you measure, on what device, to show this matters?

**Now do exercise 04.**

---

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. For the
problems no test can catch, take the measurement from the chapter before and after your fix. Then write, in two sentences,
the PR comment you would leave for the author.
