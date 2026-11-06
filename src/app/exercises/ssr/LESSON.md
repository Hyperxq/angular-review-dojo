# SSR and hydration: a lesson before the exercises

Server-side rendering asks one piece of code to run in two places. The server renders HTML so the first paint arrives
fast and crawlers see content; the browser then **hydrates** that HTML, which means Angular adopts the DOM it received
instead of building it again. Most SSR bugs come from forgetting the first place, and most hydration bugs from making
the two places disagree.

This is a Part 2 topic. Besides finding each defect, decide how bad it is and what you would write on the pull request.

How to use it:

- Read one chapter, then do its exercise.
- The examples use a library app (books, members, loans, shelves). The exercises use a shop.
- Each chapter ends with **review questions**. The question behind all of them is "does this line run on the server,
  in the browser, or both, and does it give the same answer in both?".

### Why render on the server, and when not to

What SSR buys:

- A faster first meaningful paint (First Contentful Paint, Largest Contentful Paint) on slow devices and networks,
  because the browser can show HTML before the JavaScript has downloaded and run.
- Content for crawlers and link previews that do not run JavaScript.

What it costs:

- A Node runtime that renders on every request: server CPU, a longer Time to First Byte when rendering is slow, and the
  work of caching rendered pages at a CDN.
- Code that has to run correctly in two environments (chapter 1).
- Hydration still downloads and runs the app's JavaScript. That work can still hurt Total Blocking Time and Interaction
  to Next Paint, and incremental hydration (chapter 3) exists to reduce it.

| Rendering mode | Good for | Moves mostly |
|----------------|----------|--------------|
| Client-side only (CSR) | Authenticated dashboards and tools with no search value | Nothing on first paint; simplest to run |
| Prerendering at build time (SSG) | Content that does not vary per user or per request (help pages, a catalogue that changes daily) | FCP and LCP, with no server cost per request |
| Server rendering per request (SSR) | Dynamic content that must be visible on first paint (search results, a page that depends on the request) | FCP and LCP, at a server cost per request |

### How bad is an SSR finding?

SSR findings are weighed on a few consequence axes. Apply them to each finding and the label follows:

| Axis | Ask |
|------|-----|
| Reach | Does it affect every request, one region of one page, or nobody until a rare condition? |
| Visibility | Do users see it (an error page, a dead control, flicker), or does it only show in a trace or a bill? |
| Reversibility | Can it be switched off or reverted cheaply, or has it already leaked something? |
| Proof | Can a unit test in this repo prove it, or does it need a real SSR build and a browser? |

Three examples that are not in the exercises:

- A component starts a `setInterval` clock in its constructor. In an app that still uses Zone.js, the server app never
  becomes stable (see chapter 2), so every render hangs until it times out. Reach: every request to that page. Visible to users as a slow or failed
  page.
- A "book not found" page renders a friendly message with HTTP status 200. Users see the right page; crawlers index
  thousands of empty pages. Reach is narrow, visibility is low, but it is cheap to fix.
- A server render puts a member's private loan history into the serialized transfer state of a page that a CDN then
  caches for everyone. Reach may be small, but it is not reversible once cached copies are out.

Many SSR defects are invisible in unit tests and on a developer's machine, where the app usually runs as a single-page
app. Say in the comment what you would need to prove the finding, for example "this shows up as NG0500 in the browser
console of a real SSR build".

### How the dojo simulates a server

`@angular/ssr` and `@angular/platform-server` are not installed here. The specs approximate the server with helpers in
`src/app/core/server-env.ts`: `SERVER_PLATFORM` provides `PLATFORM_ID` as `'server'`, `enterServerMode()` sets the
`ngServerMode` global, and `stubBrowserGlobals()` also hides `window`, `localStorage` and `sessionStorage`. That catches
code that touches browser globals too early and first renders that are not deterministic. It cannot show a real
hydration mismatch. Keep that limit in mind when you decide what a test can prove.

---

## Chapter 0: what moved since Angular 17

In v17 the SSR story had just been rebuilt: `ng new --ssr`, the `@angular/ssr` package, and non-destructive hydration
through `provideClientHydration()`, which already turned on DOM hydration and the HTTP transfer cache. Since then:

| Area | Angular 17 | Angular 22.2.2 (verified in the installed package) |
|------|------------|------------------------------------------------------|
| `provideClientHydration()` defaults | DOM hydration and the HTTP transfer cache. | The same two, plus **incremental hydration** and, with it, **event replay**. Opt out or configure with `withNoHttpTransferCache()`, `withHttpTransferCacheOptions({...})`, `withNoIncrementalHydration()`; `withI18nSupport()` adds i18n support. Passing both `withNoHttpTransferCache()` and `withHttpTransferCacheOptions()` throws a configuration error. |
| Incremental hydration | Did not exist. | `@defer` blocks accept `hydrate` triggers (chapter 3). `withIncrementalHydration()` is deprecated ("enabled by default with `provideClientHydration`", intent to remove in v24). |
| Event replay | Did not exist. | `withEventReplay()` records events that happen before hydration and replays them afterwards. The installed source registers it inside incremental hydration, so the default setup has it. |
| Render hooks | `afterRender` and `afterNextRender` in developer preview. | `afterEveryRender` (the renamed `afterRender`) and `afterNextRender`, both browser-only, with phases (`earlyRead`, `write`, `mixedReadWrite`, `read`). `afterRenderEffect` combines them with signals. |
| "Am I on the server?" | `PLATFORM_ID` and `isPlatformServer`. | Those still exist, but `afterNextRender`, `afterEveryRender` and the transfer cache read the `ngServerMode` global (a build-time define in real builds). |
| `DOCUMENT` | Only from `@angular/common`. | Exported from `@angular/core`; `@angular/common` re-exports it. |
| Request data | Express-specific injection tokens in the generated server. | `REQUEST`, `RESPONSE_INIT` and `REQUEST_CONTEXT` tokens in `@angular/core`. They are `null` in the browser and during prerendering. |

### Choosing the mode per route

Recent versions of `@angular/ssr` let one app mix the three modes per route ("hybrid rendering"): server routes declared
with `RenderMode.Server`, `RenderMode.Prerender` or `RenderMode.Client`, `getPrerenderParams` for parameterized
prerendered routes, `provideServerRendering(withRoutes(...))` on the server, `AngularNodeAppEngine` to serve it, and the
builder's `outputMode`. `@angular/ssr` is not installed in this repo, so none of these names were checked against
installed types; read the docs for your version. They matter in review because "should this page be server-rendered at
all?" becomes a decision per route.

---

## Chapter 1: code that runs on both platforms (exercise 01)

### The problem

Server rendering is for the visitors who wait longest for a page: people on slow phones and networks, and the crawlers
that decide how a page ranks. Once it is on, every component runs in two places, and code written with only the browser in
mind puts exactly those visitors at risk.

### The class runs twice

When a page is server-rendered, Angular builds the component tree in Node, renders it to HTML, and sends it. The browser
then builds the same tree again and hydrates. So the same class is constructed twice, in two very different
environments:

```flow
Browser request -> Server: constructs components and renders HTML
Server -> Browser: HTML plus serialized state
Browser -> Hydration: constructs the same components again and adopts the DOM
Hydration -> afterNextRender callbacks: browser-only work runs here
```

| Code | Server | Browser |
|------|--------|---------|
| Constructor and field initializers | runs | runs |
| `ngOnInit`, `computed`, the first render | runs | runs |
| Event handlers (`(click)`, `host: { '(window:resize)': ... }`) | never fires | runs |
| `afterNextRender`, `afterEveryRender` | skipped | runs |

Node has no `window`, no `localStorage`, no `matchMedia`, no `navigator` as the browser knows it.

### The tools

| You need | Use | Why |
|----------|-----|-----|
| The document | `inject(DOCUMENT)` | On the server it is the server's DOM; in tests it is the TestBed's. |
| The page title and meta tags | `inject(Title)`, `inject(Meta)` | Work on both, and the server writes them into the HTML it sends. |
| Browser-only reads or DOM measurement | `afterNextRender(...)` | Runs once, after the first render, only in the browser. Pass phases (`{ read: () => ... }`, `{ write: ... }`) to keep DOM reads and writes apart and avoid layout thrashing. |
| A choice made before anything renders | `isPlatformBrowser(inject(PLATFORM_ID))` | For synchronous decisions, typically in a provider factory. |
| Data from the incoming request | `inject(REQUEST)` | The server's `Request`, `null` in the browser. |

### A worked example: one interface, two implementations

A library app keeps a member's "recently viewed books" list. In the browser it lives in `localStorage`; on the server there
is no storage at all. Instead of checking the platform at every call site, provide one abstraction and choose its
implementation once:

```ts
export abstract class KeyValueStore {
  abstract get(key: string): string | null;
  abstract set(key: string, value: string): void;
}

class MemoryStore extends KeyValueStore {
  private readonly data = new Map<string, string>();
  get(key: string) { return this.data.get(key) ?? null; }
  set(key: string, value: string) { this.data.set(key, value); }
}

class WebStorageStore extends KeyValueStore {
  get(key: string) { return localStorage.getItem(key); }
  set(key: string, value: string) { localStorage.setItem(key, value); }
}

export const provideKeyValueStore = () => ({
  provide: KeyValueStore,
  useFactory: () => (isPlatformBrowser(inject(PLATFORM_ID)) ? new WebStorageStore() : new MemoryStore()),
});
```

Components inject `KeyValueStore` and never touch a global. The server no longer crashes. But notice what the factory does
**not** solve: on the server `get` returns `null`, and in the browser it returns the member's list. If the first render
shows that list, the two renders differ. Removing the crash and keeping the two renders the same are separate problems.

When not to use a platform check: when the same thing can be expressed in a way that works on both platforms (`Title`
instead of `document.title`), or when the work only belongs after rendering (`afterNextRender`). Each `isPlatformBrowser`
branch is a second code path that needs its own test.

### The first render should be the same on both sides

The server does not know what is in the reader's storage or how wide their screen is. Rendering a value that only the
browser knows makes the first client render differ from the server's HTML. What that does depends on the difference
(chapter 2): different text flickers when the binding updates; different structure throws NG0500.

The usual answer is to render a neutral state both sides agree on and fill in the browser value after the first render.
That has a measurable cost: the update can shift layout (Cumulative Layout Shift) or replace the largest element after it
painted (Largest Contentful Paint). Reserving space for the late value avoids the shift; making the server aware of the
value (from the request) avoids the late update.

### Review questions

- For each line in a constructor or initializer: would it work in a process that has no browser?
- Which of these platform checks could be replaced by a tool that works on both platforms?
- Does anything in the first render depend on a value only the browser knows?
- What does the late update cost in layout shift or LCP, and could the server know the value instead?

**Now do exercise 01.**

---

## Chapter 2: hydration matches by structure (exercise 02)

### The problem

Hydration is what makes SSR cheap for the browser: it adopts the HTML instead of rebuilding it. When the HTML and the
browser's first render disagree, Angular cannot adopt the HTML as it is and the benefit is gone: users pay for the server
render and then for the client work it was meant to save them.

### What hydration checks

Hydration walks the server DOM alongside the component tree and claims existing nodes instead of creating new ones. For
each node it checks the node type and, for elements, the tag name. When the DOM it finds does not have the shape the
template describes, Angular throws an error from the NG0500 family ("Expected DOM node did not match the server-rendered
DOM") and does not recover that view. Only `ngSkipHydration` opts a subtree into destroy-and-re-render, and you choose
that ahead of time (chapter 3).

Text is not compared. If the server rendered "10:00" and the browser computes "11:00", the node still matches, and the
text changes when the binding updates: the user sees a flicker. If the difference changes structure (an `@if` that flips,
an `@for` with a different number of items), the walk meets a node it did not expect and throws.

Three families of cause produce those differences. Learn to name which one you are looking at.

### 1. Values that differ between the two renders

The clock, randomness, the time zone, the locale, storage, the viewport. Take an "open now" badge computed from the
current hour. The server runs in UTC, the reader's browser in their local time zone, so near closing time the server may
render the badge and the browser not: different structure, NG0500.

Making the first render deterministic means choosing one source for the value both renders use: format times in a fixed
time zone both sides know (`DatePipe` accepts a time zone argument), compute the value from data both sides receive, or
let the browser fill it in after hydration and accept the late update (with its layout cost from chapter 1).

### 2. HTML that the parser reshapes

The server sends a string. The browser parses it with the HTML parser, which follows the HTML specification and repairs
markup that breaks its content rules. Angular's template compiler does not make those repairs, so the browser ends up
with a tree Angular does not expect:

```html
<p>Shelves: <ul><li>Fiction</li></ul></p>
<!-- parsed as <p>Shelves: </p><ul><li>Fiction</li></ul><p></p> -->

<button>Reserve <button>Info</button></button>
<!-- parsed as <button>Reserve </button><button>Info</button> -->
```

A `<ul>` cannot live inside a `<p>`, and a `<button>` cannot live inside another `<button>`; the parser closes the outer
element early. Valid HTML is the whole fix for this family. An HTML validator on the server output, or reading the content
model of each element you nest, catches it before hydration does.

### 3. DOM changes behind Angular's back

Anything that changes the DOM without changing the template: a directive that moves its host into `document.body` to act
as an overlay, a script in `index.html` that inserts a banner into the app's root element, a widget that rewrites the
markup it was given. Hydration expects the DOM the template describes and finds something else. Keep markup in templates;
start browser-only DOM work in `afterNextRender`, after hydration has finished with that subtree.

These are the hardest to catch: jsdom renders them happily, so unit tests pass.

### Stability: when the server is done

The server does not serialize the page as soon as the template has run. It waits until the application is **stable**:
no pending tasks. `HttpClient` requests register as pending tasks, and so does work you register with `PendingTasks`.
That is why a server render includes the data it fetched.

It also means that work which never finishes keeps the app unstable. In a zoneless app, the default since v21, only
pending tasks count. With Zone.js, an interval or a polling loop started on the server holds the render until it times out. In the browser, an app that never becomes stable reports NG0506 in dev
mode. When you review code that starts something periodic, ask where it starts and what stops it on the server.

### The HTTP transfer cache

Without it, a server-rendered page fetches its data twice: on the server to render, and in the browser when the same
components start up.

```flow
Server render -> Library API: GET /api/shelves
Library API -> Server render: response stored in TransferState
Server render -> Browser: HTML plus a script element with the stored state
Browser -> HttpClient: GET /api/shelves again during startup
HttpClient -> Browser: answered from the transfer cache without a network request
```

What the installed source says about when the cache answers and what it skips:

- It answers only until the browser app first becomes stable. A request made after that (from a timer, after a click,
  from code that waits for something) goes to the network, even if the server made the same request.
- It caches `GET` and `HEAD`; `POST` only with `includePostRequests: true`.
- It skips requests with `Authorization`, `Proxy-Authorization` or `Cookie` headers, unless
  `includeRequestsWithAuthHeaders` is set.
- It skips requests sent with credentials (`withCredentials`, or fetch `credentials` of `'include'` or `'same-origin'`),
  unless `includeRequestsWithCredentials` is set.
- It skips requests whose `Cache-Control` header says `no-store`, `private` or `no-cache`, or whose fetch `cache` option is
  `no-cache` or `no-store`, unless `includeNonCacheableRequests` is set.
- A request can opt out with its own `transferCache: false` option, and `withHttpTransferCacheOptions({ filter })` can
  exclude more.

Opting in to the authenticated cases writes those responses into the page source, which matters if pages are cached.

### Review questions

- For each value in the first render: where does it come from, and would the other platform compute the same one?
- Would the browser's HTML parser read every template exactly as written?
- Does anything change the DOM outside a template, and when does it run relative to hydration?
- What does this page start on the server that might never finish?
- For each request on this page, would the browser repeat it, and would the cache take it?
- What does the user lose if this goes wrong, and how would you prove it?

**Now do exercise 02.**

---

## Chapter 3: deciding when each part hydrates (exercise 03)

### The problem

Full hydration downloads and runs the code for the whole page before any of it responds. On a long page with widgets
nobody touches, that is JavaScript paid for nothing, and it delays the moment the parts people do use become responsive
(Total Blocking Time, Interaction to Next Paint). Incremental hydration lets you pay for each region when it is needed,
and every choice you make there is a statement about how people use that region.

### `@defer` on the server

The rule changes depending on the trigger:

- A plain `@defer` (no `hydrate` trigger) renders its **placeholder** on the server. The main content is loaded later in
  the browser by its ordinary trigger (`on viewport`, `on idle`, ...).
- A `@defer` with a `hydrate` trigger renders its **main content** on the server. In the browser that content stays
  dehydrated (visible, but without its JavaScript, listeners or bindings) until the hydrate trigger fires; then Angular
  loads its code and hydrates it.

`hydrate` triggers apply only to the first, server-rendered load. When the same block appears after a client-side
navigation, there is no server HTML to hydrate, and the ordinary triggers decide. So
`@defer (on viewport; hydrate on idle)` is two statements: what to do after a navigation, and what to do on first load.

| Trigger | Hydrates when |
|---------|---------------|
| `hydrate on immediate` | right after the rest of the page hydrates |
| `hydrate on idle` | the browser is idle |
| `hydrate on viewport` | the block scrolls into view |
| `hydrate on interaction` | the user clicks or presses a key inside the block |
| `hydrate on hover` | the pointer enters the block, or focus moves into it (keyboard users included) |
| `hydrate on timer(500ms)` | after a delay |
| `hydrate when cond` | an expression becomes true |
| `hydrate never` | never: the block stays static HTML for the life of the page |

### A worked choice

A book page ends with a comments widget: a list of comments and a form to add one. Its code is large (a rich-text editor),
and most readers never scroll that far.

| Option | What it costs | When it fits |
|--------|---------------|--------------|
| `hydrate on idle` | Downloads the widget's code on every visit, even for readers who never see it. The page is ready when they arrive. | The widget is small, or most readers use it. |
| `hydrate on viewport` | Downloads only for readers who scroll there; the code loads as the widget appears, so a fast scroller may wait. | The widget is large and below the fold, as here. |
| no `@defer` | Hydrates with the page, paying for it before anything else becomes responsive. | The widget is above the fold and used by most readers. |

`hydrate never` is the extreme: zero JavaScript for that region, a real gain for large static content such as a long
synopsis or a footer. It also means no listeners and no bindings that react to state, ever. Above-the-fold content that
must respond at once is a poor fit for any deferred hydration.

### Event replay

Before a region hydrates, there are no Angular listeners on it. Event replay closes the gap. A small dispatcher in the page
records events on server-rendered elements, and Angular replays them to the real listeners once the code is there. It
covers the whole page while the main bundle loads, and each deferred block until it hydrates; in Angular 22 it comes with
incremental hydration (chapter 0).

Replay keeps the event; it does not remove the wait. If a region needs a large download before it can respond, the person
who triggered it waits for that download, and the delay counts against Interaction to Next Paint. The more likely an
interaction and the more it matters, the less you want its code behind a slow trigger.

### `ngSkipHydration` is for code you do not control

Adding the `ngSkipHydration` attribute to a component's host tells Angular not to hydrate that component and everything
inside it. In the browser, Angular discards the server DOM of that subtree and renders it again from scratch.

That is the right tool for a component that cannot hydrate, typically one wrapping a third-party library that rewrites its
own DOM. Added to your own component, it usually makes NG0500 errors disappear from the console while their cause stays.
The subtree is still rebuilt (users see it flash, the browser does the work twice, and the benefit of SSR for that region
is gone).

### Review questions

- For each `@defer (hydrate ...)` block: what does its trigger say about how people use that region, and is that true?
- What does each region cost in JavaScript before it responds, and who pays it: every visitor, or only those who use it?
- After a client-side navigation, which trigger applies to this block?
- For each `ngSkipHydration`: which error did it silence, and what was the cause?
- What would this page's Interaction to Next Paint look like for the region people use most?

**Now do exercise 03.**

---

## After the lesson

For each exercise, write your findings with a severity on each, and for each one note whether a unit test in this repo can
prove it or only a real SSR build can. Then compare with `SOLUTION.md` on the `solutions` branch. A good SSR comment names
the platform where the problem appears and how to see it.
