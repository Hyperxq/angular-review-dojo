# Routing: a lesson before the exercises

You configured routers in every Angular version you used. You wrote `RouterModule.forRoot(routes)`, class guards with
`implements CanActivate`, and `this.route.params.subscribe(...)` in half your components. The router you come back to does
the same job with a smaller surface: plain functions for guards and resolvers, route data bound straight into component
inputs, and return values that describe redirects. This lesson walks through it one chapter per exercise, in the same order.

How to use it:

- Read one chapter, then do its exercise. Each chapter assumes the previous exercise is done.
- The examples use a different domain on purpose: a library with books, members, loans and shelves. The lesson gives you the
  pieces, and the exercise makes you find where they are missing and put them together yourself.
- Every chapter ends with review questions. Ask them out loud while you read the exercise code, and try them in the running
  app. Router bugs rarely throw, so you find them by navigating and watching what happens.

---

## Chapter 0: what moved since Angular 17

The router's concepts are the ones you remember: a tree of routes, outlets, guards, resolvers, lazy loading. What changed is
how you write them, and a few defaults.

### Functions replaced classes

In v17 functional guards already existed, but most codebases still had `@Injectable` guard classes. In v22 the class and
token forms are deprecated (the router types call them `DeprecatedGuard`). Guards and resolvers are plain functions that
call `inject()`:

```ts
export const isLibrarian: CanMatchFn = () => inject(StaffSession).role() === 'librarian';

export const bookResolver: ResolveFn<Book> = (route) =>
  inject(BookApi).get(route.paramMap.get('isbn')!);
```

They run in an injection context, but only synchronously. An `inject()` after an `await` throws `NG0203`, so inject first,
then do the async work.

`canLoad` is deprecated as well, and `canMatch` replaces it. Chapter 3 is about when each guard runs.

### What a guard may return

| Type | Shape |
|------|-------|
| `GuardResult` | `boolean \| UrlTree \| RedirectCommand` |
| `MaybeAsync<T>` | `T \| Observable<T> \| Promise<T>` |
| `CanActivateFn` | `(route, state) => MaybeAsync<GuardResult>` |
| `CanMatchFn` | `(route, segments, currentSnapshot) => MaybeAsync<GuardResult>` |
| `ResolveFn<T>` | `(route, state) => MaybeAsync<T \| RedirectCommand>` |

`RedirectCommand` arrived in v18. It wraps a `UrlTree` plus navigation options (`new RedirectCommand(tree, { replaceUrl:
true })`), and resolvers are allowed to return one too. `redirectTo` on a route can also be a function now, which receives the
partially matched route and returns a string or `UrlTree`.

### Route data flows into inputs

`withComponentInputBinding()` (added in v16, so you may have missed it) makes the router write route values into the routed
component's inputs. This app enables it in `app.config.ts`. Combined with signal inputs, a routed component often needs no
`ActivatedRoute` at all:

```ts
export class BookPage {
  readonly isbn = input.required<string>();   // from the path books/:isbn
}
```

Chapter 2 covers the rules.

### Defaults that changed

- `paramsInheritanceStrategy` now defaults to `'always'`: a child route sees all of its parents' params. In v17 the default
  was `'emptyOnly'`, which is why old code walks `route.parent.params`. `withRouterConfig({ paramsInheritanceStrategy:
  'emptyOnly' })` brings the old behaviour back.
- `Router.getCurrentNavigation()` is deprecated since 20.2 in favour of the `router.currentNavigation` signal.
- `withNavigationErrorHandler(handler)` lets you decide what happens when a navigation throws, and the handler may return a
  `RedirectCommand`.

> [!NOTE]
> Angular 22.2 adds `withRouterResources()` and `nonBlocking()` as developer previews, so routes can declare resources. None
> of the exercises use them, and the API may still change.

### Zoneless and OnPush

This app is zoneless and every component is OnPush by default (Angular 22's default; the old strategy is now called
`Eager`). The router plays well with that: it sets bound inputs through the framework, which marks the view for check. A plain
field you assign from a router callback gets no such treatment, the same trap you will meet in the RxJS and performance
lessons.

---

## Chapter 1: how the router matches a URL (exercise 01)

### The symptom

A member bookmarks a page, opens the bookmark a week later, and lands on "not found". QA clicks through the navigation and
cannot reproduce it, because the menu happens to use URLs that still work. Route config bugs look like this: no build error,
no console warning, a page that some URLs never reach. Finding them takes a tool, not luck.

### The mental model

Many routers look for the best match. Angular's takes the URL, walks the `Routes` array from the top, and stops at the first
entry that matches. The order of the array is part of the program's behaviour, the same way the order of `if / else if`
branches is.

For each entry it asks one question: do this entry's segments match the start of what is left of the URL?

| Path segment | Matches |
|--------------|---------|
| `books` | exactly the segment `books` |
| `:isbn` | any one segment, captured as the param `isbn` |
| `**` | anything, including nothing |
| `''` | nothing, with prefix matching by default |

A param segment matches any one segment, whatever its text: `/books/search` against `books/:isbn` matches, with
`isbn = 'search'`. And `**` matches every URL there is.

### Walking the array by hand

The review tool for a route config is to pick a URL and walk the array yourself, top to bottom, stopping at the first match.
Here is a library config:

```ts
export const LIBRARY_ROUTES: Routes = [
  { path: '', redirectTo: 'books', pathMatch: 'full' },
  { path: 'books', component: CatalogPage },
  { path: 'books/search', component: SearchPage },
  { path: 'books/:isbn', component: BookPage },
  { path: 'loans', component: LoansPage, canActivate: [hasLibraryCard] },
  { path: '**', component: NotFoundPage },
];
```

and the walk for `/books/search`:

```flow
URL /books/search -> try the empty path
try the empty path -> try books: pathMatch full needs an empty URL
try books -> try books/search: one segment is left over and books has no children
try books/search -> SearchPage: both segments match, the walk stops here
```

Do the same walk for every URL a user can reach: links in the navigation, links inside pages, bookmarks, links in emails.
An entry that no URL can reach is a common bug, and a silent one.

### `pathMatch` and the empty path

`pathMatch: 'prefix'` (the default) means "my segments match the start of the URL". `'full'` means "my segments are the
whole URL". An empty path with prefix matching matches the start of every URL, which is why Angular 22 refuses
`{ path: '', redirectTo: 'books' }` without `pathMatch: 'full'` and throws `NG04014` when it processes the config. A
non-empty redirect keeps prefix matching and carries the rest of the URL along: `{ path: 'catalogue', redirectTo: 'books' }`
sends `/catalogue/42` to `/books/42`.

### What a guard's answer means

A guard does more than say yes or no. Each return value tells the router what to do with the navigation:

| Guard returns | The router | The user sees |
|---------------|------------|---------------|
| `true` | continues the navigation | the target page |
| `false` | cancels the navigation | the page they were on; on a first load from a bookmark, an empty outlet |
| `UrlTree` or `RedirectCommand` | cancels this navigation and starts one to the tree | the page you pointed to |

`false` fits when staying put makes sense to the user, for example a button-driven navigation inside a page they are already
reading. When the user can arrive at the URL directly (a bookmark, a shared link, a reload), decide where they should land
and return that as a tree:

```ts
export const hasLibraryCard: CanActivateFn = () =>
  inject(MemberSession).hasCard() || inject(Router).createUrlTree(['/join']);
```

`router.createUrlTree([...])` builds a tree from commands, and `router.parseUrl('/join')` builds one from a string.

### Review questions

- For each URL a user can reach, walk the `Routes` array top to bottom. Which entry does it hit first, and is that the page
  the link promises?
- Type each URL into a fresh tab instead of clicking. Does every one land where it should?
- When each guard says no, where does the user end up, both from a click and from a bookmark?

**Now do exercise 01.**

---

## Chapter 2: the router reuses your component (exercise 02)

### The symptom

A member browses from one book to the next and reserves a copy. Every screen they see has to describe the book in the
URL, because that is the book they think they are reserving. The router has its own idea of when a page is new, and it
does not always match the member's. A reservation for the wrong book crashes nothing, so no error report will tell you
about it.

### Same route, same instance

Navigate from `/books/1` to `/books/2`. Both URLs match the same `Route` object, so the router keeps the `BookPage` that is
already on screen and only updates its route data. There is no new constructor, no new `ngOnInit`, no new field
initializers. The same happens when only the query string or the fragment changes.

```flow
/books/1 -> BookPage created: constructor, ngOnInit
BookPage created -> /books/2: same Route object
/books/2 -> BookPage reused: no constructor, no ngOnInit
BookPage reused -> /books/2?view=copies: query string only
/books/2?view=copies -> BookPage reused again: still the same instance
```

So everything the component reads once is read once for the lifetime of the instance, which can be many URLs long.

### Three ways to read route data

| Source | What it gives you | Follows later URLs? |
|--------|-------------------|---------------------|
| `route.snapshot` | the route state at one moment | no, it is a photo |
| `route.paramMap`, `route.queryParamMap`, `route.data` | observables of each part | yes, while subscribed |
| bound inputs (`withComponentInputBinding`) | signal inputs set by the router | yes |

The snapshot is only safe when you know the component is recreated for every value, and with the default reuse behaviour you
rarely know that.

### The rules of input binding

Taken from the router's own documentation and types:

- The router binds from query params, path and matrix params, static `data`, and resolver results.
- When two sources share a key, the later one in that list wins, so resolver results override params and static data. With
  `withRouterResources()` enabled, route resources come after resolver results.
- By default (`unmatchedInputBehavior: 'alwaysUndefined'`), an input with no matching key in the current route is set to
  `undefined`, so a value from a previous URL is never kept. `'undefinedIfStale'` only resets inputs that the router set
  earlier in the life of that route.
- `withComponentInputBinding({ queryParams: false })` turns query params off as a source.

### Load in the page, or before it

A resolver makes the navigation wait for data. Loading inside the page shows the new page at once and the data when it
arrives:

```ts
export class BookPage {
  private readonly api = inject(BookApi);
  readonly isbn = input.required<string>();

  readonly copies = rxResource({
    params: () => this.isbn(),
    stream: ({ params: isbn }) => this.api.copies(isbn),
  });
}
```

`rxResource` reruns when `isbn` changes and cancels the previous request, so a reused component follows the URL.

| | Resolver | Load in the page |
|-|----------|------------------|
| While loading | the user stares at the old page | the new page shows, with a skeleton |
| Missing data | redirect before the page exists | the page shows an inline "not found" |
| Fits | data the page cannot render at all without | most pages |

### When resolvers run again

A resolver does not rerun on every navigation. `Route.runGuardsAndResolvers` decides:

| Value | Reruns guards and resolvers when |
|-------|----------------------------------|
| `'paramsChange'` (default) | path or matrix params change |
| `'pathParamsChange'` | path params change (matrix params ignored) |
| `'pathParamsOrQueryParamsChange'` | path params or query params change |
| `'paramsOrQueryParamsChange'` | any params or query params change |
| `'always'` | on every navigation to the route |
| a function `(from, to) => boolean` | the function says so |

### A resolver that fails

The navigation waits for every resolver. If one errors, the navigation fails with a `NavigationError`: the router stays on
the previous page and the error goes to the console, or to your `withNavigationErrorHandler`. If a resolver completes without
emitting, the navigation is cancelled with the code `NoDataFromResolver`.

```flow
click a link -> guards pass
guards pass -> resolver runs
resolver runs -> page activates: value emitted
resolver runs -> navigation fails: error, the old page stays
resolver runs -> navigation cancelled: completed with no value
```

Where the "what if the data is not there?" answer lives is a design choice:

- in each resolver, which knows its own data and can send the user somewhere specific;
- once, in `withNavigationErrorHandler`, which catches every failed navigation and can return a `RedirectCommand` to a
  generic error page.

A resolver can also refuse before it asks the server. `ResolveFn<T>` may return `T | RedirectCommand`:

```ts
const ISBN = /^\d{13}$/;

export const bookResolver: ResolveFn<Book> = (route) => {
  const isbn = route.paramMap.get('isbn') ?? '';
  if (!ISBN.test(isbn)) {
    return new RedirectCommand(inject(Router).parseUrl('/books'));
  }
  return inject(BookApi).get(isbn);
};
```

> [!TIP]
> Call `inject()` in the resolver body, before any async step. Inside an RxJS callback the injection context is gone.

### Review questions

- Go from one item to the next without a reload. Does every value on screen change with the URL?
- Add and remove each query param by hand. What does the page show when one is absent?
- Which route values does the component read, and from where: snapshot, observable, or input?
- Open an id that does not exist. What does the user see, and where does the error go?
- Does each resolver run again when only the query string changes? Count the requests in the Network panel.

**Now do exercise 02.**

---

## Chapter 3: when each guard runs, and lazy loading (exercise 03)

### The symptom

The librarian area is lazy loaded and guarded. Open the Network panel as an anonymous visitor, type the area's URL, and
watch: does the librarian bundle download before the visitor is turned away? If it does, every visitor pays for that code
on their data plan, and anyone can read it in DevTools.

> [!IMPORTANT]
> Client-side guards are a user-experience and bandwidth boundary. They are not authorization: anyone can change JavaScript
> in their own browser. The API must check the user's role on every request. A guard decides what the user sees and what
> the browser downloads.

### The navigation pipeline

Guards are not interchangeable. Each one runs at a fixed point of the navigation:

```flow
navigation starts -> recognize the URL
recognize the URL -> canMatch: tried on each candidate route while matching
canMatch -> loadChildren: only for a route that matched, still during recognition
loadChildren -> canDeactivate: on the routes being left
canDeactivate -> canActivateChild and canActivate: on the routes being entered, parent first
canActivateChild and canActivate -> resolvers
resolvers -> loadComponent: for the lazy pages about to be shown
loadComponent -> activate components
activate components -> NavigationEnd
```

Read it with one question for each guard in a config: at the step where this guard runs, has the route's lazy code already
been requested?

Facts about `canMatch` to carry along:

- It runs during matching, on every navigation whose URL passes through the route, including moves between the children of
  an area the user is already in.
- When it returns `false`, the route does not match and the router tries the next entries in the array. The URL may end at
  `**`, so the user sees "not found" instead of a redirect. Return a `UrlTree` when you want a redirect.
- It does not stop preloading. The preloader skips a lazy route only when `canLoad` is defined, so
  `withPreloading(PreloadAllModules)` still downloads bundles guarded by `canMatch`.
- Like every guard, it only runs when a navigation happens. If the state it checks changes while the user sits on a page,
  nothing reacts until the next navigation, unless your code navigates.

### Lazy pages

| Property | The page's code is | Fetched |
|----------|--------------------|---------|
| `component: Page` | imported statically by the route file | with the route file |
| `loadComponent: () => import('./page').then((m) => m.Page)` | its own chunk | once guards and resolvers let a navigation through |
| `loadChildren: () => import('./area.routes').then((m) => m.ROUTES)` | its own chunk, with the child routes | during recognition |

If the file has a `default` export, `loadComponent: () => import('./page')` is enough.

### A guard describes the outcome

A guard returns its decision, and the router acts on it. The router reports what happened through `NavigationCancel` events
on `router.events`, each with a code:

| `NavigationCancellationCode` | Meaning |
|------------------------------|---------|
| `Redirect` | a guard returned a `UrlTree` (or `RedirectCommand`) |
| `GuardRejected` | a guard returned `false` |
| `SupersededByNewNavigation` | a newer navigation started |
| `NoDataFromResolver` | a resolver completed without a value |

Analytics, logging and tests read these codes, so the value a guard returns is part of its contract: a redirect should be
reported as a redirect.

### Everything about the target is passed in

A guard does not need to look anywhere else to learn where the navigation is going:

| Guard | Receives |
|-------|----------|
| `canActivate(route, state)` | `route`: the target route snapshot (params, data); `state.url`: the target URL |
| `canActivateChild(childRoute, state)` | the child being entered, and the target URL |
| `canMatch(route, segments, currentSnapshot)` | the `Route` config, the URL segments being matched, and a snapshot of the match so far |
| `canDeactivate(component, currentRoute, currentState, nextState)` | the component being left, and where the user is going |

Route `data` lets one guard serve several routes:

```ts
export const hasRole: CanActivateFn = (route) =>
  inject(StaffSession).roles().includes(route.data['role']) || inject(Router).createUrlTree(['/staff']);

{ path: 'acquisitions', component: AcquisitionsPage, canActivate: [hasRole], data: { role: 'buyer' } }
```

### Review questions

- As an anonymous visitor, open each protected URL in a fresh tab with the Network panel open. Which chunks download before
  you are turned away?
- Subscribe to `router.events` and deny a navigation. Which `NavigationCancel` code does it report?
- After signing in, where does the user land, compared with the URL they typed?
- If preloading were turned on, which guarded chunks would download anyway?
- What does the API return when the same user calls it directly?

**Now do exercise 03.**

---

## Chapter 4: nested routes and relative navigation (exercise 04)

### The symptom

A members feature works at `/members/12`. Then the library opens branches and mounts the same feature under
`/branches/3/members/12`. Half the links now lead out of the feature, and the team discovers which ones only by clicking.
A feature that knows its own prefix breaks the day it is mounted somewhere else.

### Every level renders the next

A route with `children` describes a component tree. Each level of the route tree that has a `component` renders the next
level inside its own `<router-outlet />`:

```tree
AppShell [outlet]
  members/:memberId MemberLayout [outlet]
    '' redirect to loans
    loans LoansPage [outlet]
      :loanId LoanDetail
    profile ProfilePage
```

For `/members/12/loans/5` the router activates `MemberLayout`, then `LoansPage` inside it, then `LoanDetail` inside that.
A child that declares `outlet: 'name'` goes into `<router-outlet name="name" />` instead. Chapter 5 is about named outlets.

### Absolute and relative links

`routerLink` and `router.navigate` both take commands, and both treat a leading `/` as "start from the root of the app".
Without it, they differ:

| API | Relative to |
|-----|-------------|
| `[routerLink]="['5']"` | the `ActivatedRoute` of the component whose template holds the link |
| `router.navigate(['5'])` | the root, because `relativeTo` defaults to `null` |
| `router.navigate(['5'], { relativeTo: this.route })` | the route you pass |

`routerLink` knows where it is because it injects the `ActivatedRoute` of its component. `Router` is a root service and has
no idea which component called it.

The commands read like a file system:

```ts
// in LoansPage, at /members/12/loans
[routerLink]="[loan.id]"               // /members/12/loans/5
[routerLink]="['../profile']"          // /members/12/profile

// also in LoansPage, after a save
private readonly route = inject(ActivatedRoute);
openProfile() {
  this.router.navigate(['../profile'], { relativeTo: this.route }); // /members/12/profile
}
```

When you can use a link, prefer it: it is relative by default, accessible, and it works with middle-click.

### Params from the parent

`LoansPage` sits under `members/:memberId`. With the v22 default `paramsInheritanceStrategy: 'always'`, `memberId` is part of
the child's params, so `readonly memberId = input<string>()` in `LoansPage` receives it. If you see a component walking
`route.parent` to get a param, it is probably written for the old default.

### Guards on a parent route

A parent stays active while the user moves between its children. That matters for guards:

| Guard on the parent | Runs |
|---------------------|------|
| `canActivate` | when the parent route is entered (and when its own params change); not when the user moves between its children |
| `canActivateChild` | before every navigation to any of its children, including moves between them |
| `canMatch` | on every navigation that matches through the route; a `false` makes the URL fall through to later routes (Chapter 3) |

So ask what can change while the user is inside the area. A rule that holds for the whole visit (the member record exists)
is checked once. A rule that can stop holding mid-visit (a librarian suspends the membership while the member is browsing)
needs to be checked on every move inside the area. `CanActivateChildFn` has the signature
`(childRoute, state) => MaybeAsync<GuardResult>`.

### Review questions

- Open the deepest URL of the feature directly in a new tab. Which components render, and where on the page?
- Click every link and button in the feature and read the address bar. Does each one stay under the feature's prefix?
- Imagine the feature mounted under another prefix. Which links and `navigate` calls would break?
- Suspend the user's access while they are inside the area, then click a sibling link. Which guard runs?

**Now do exercise 04.**

---

## Chapter 5: route providers, leave guards, named outlets and titles (exercise 05)

This exercise has four independent problems, so this chapter has four small topics.

### Providers on a route

Who gets hurt first: staff doing long tasks in several steps, such as cataloguing a donated collection, where losing or
mixing up work in progress costs them real time. Where an instance lives decides who shares it, and for how long.

`Route.providers` creates an `EnvironmentInjector` for that route, used by the route and all its children. Picture the
injectors next to the route tree:

```tree
root injector [providedIn root]
  members route injector
    loans route injector [provides LoanFilters]
      LoansPage
    profile route
      ProfilePage
  catalog route
    CatalogPage
```

A lookup climbs from the component's route injector toward the root and stops at the first injector that provides the
token. `LoansPage` finds `LoanFilters` in the loans route injector. From `ProfilePage` the climb goes profile route, members
route, root, and none of them provides it, so the injection fails. A lookup only goes up, never across to a sibling, and each
route that lists a provider gets its own instance. So for each piece of route-scoped state, ask: which routes would have to
share this?

About lifetime: the router creates a route's injector the first time it matches that route and keeps it on the `Route`
object, so later visits reuse it. Destroying injectors of inactive routes is opt-in, through `withAutoCleanupInjectors()`
(public API since 22.2). Do not count on a route provider being reset when the user leaves.

A class provided this way is decorated with plain `@Injectable()` (no `providedIn`), so it cannot be injected anywhere the
provider is missing. The options compared:

| Where | Shared by | Lives |
|-------|-----------|-------|
| `providedIn: 'root'` | the whole app | as long as the app |
| `Route.providers` | the route and its children | from first match; cleanup is opt-in |
| `Component.providers` | that component and its view children | as long as that component instance |
| a root store keyed by entity id | everyone who asks for that id | until you evict the entry |

Pick by lifetime first: when should this state start fresh?

### Leave guards

`canDeactivate` runs for each route the navigation deactivates, and it receives the component being left plus the
destination:

```ts
type CanDeactivateFn<T> = (component: T, currentRoute, currentState, nextState) => MaybeAsync<GuardResult>;
```

`nextState` lets a guard treat destinations differently. A checkout desk might let the librarian move freely within
circulation and ask only when they go elsewhere:

```ts
const stayInCirculation: CanDeactivateFn<CheckoutDesk> = (_desk, _route, _state, nextState) =>
  nextState.url.startsWith('/circulation') || confirm('Leave the checkout desk?');
```

Limits to know:

- A leave guard covers router navigations only. Reloading the page or closing the tab skips it; the browser's
  `beforeunload` event is the tool for those.
- `confirm()` is a native dialog that blocks the main thread and cannot be styled. A guard may return an `Observable` or
  `Promise` of the answer, so an app dialog works too.

### Named outlets

A secondary outlet shows a route next to the primary one, and its URL looks like `/books(notes:history)`:

```html
<!-- the link -->
<a [routerLink]="[{ outlets: { notes: ['history'] } }]">History</a>

<!-- the outlet in the template -->
<router-outlet name="notes" />
```

```ts
// the route
{ path: 'history', outlet: 'notes', component: LoanHistory }
```

Close it with `{ outlets: { notes: null } }`. The benefit is a shareable URL: a link or a reload restores the side panel.
The cost is URLs that are harder to read and links that are harder to build. A panel that nobody needs to link to can be a
plain signal and an `@if`.

### Titles

A route's `title` is a string, or a `ResolveFn<string>` for dynamic titles. The default strategy sets `document.title` to
the title of the deepest primary route that has one, so a `title` on a parent covers its untitled children. To change how
titles are built (append the app name, for example), extend `TitleStrategy`: implement `updateTitle(snapshot)`, use the
inherited `buildTitle(snapshot)` to get the route's title, and register it with
`{ provide: TitleStrategy, useExisting: YourStrategy }`.

Titles matter beyond the tab strip: screen readers announce the new title after a navigation, and it is often the only
signal a blind user gets that the page changed.

### Review questions

- Type into the editor, switch to a sibling tab and back. Is the data still there? How many instances of the state exist
  (Angular DevTools shows the injector tree)?
- Leave the editor in every way you can: a sibling tab, another page, after saving, without changes. When does the
  confirmation appear, and does that match when something could be lost?
- Follow each link to a named outlet. Which component ends up in which outlet?
- Visit every page and read the browser tab. What does it say on each one?

**Now do exercise 05.**

---

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write, in
two sentences, the PR comment you would leave for the author. If you cannot write it without looking, reread the chapter: the
concept is not yours yet.
