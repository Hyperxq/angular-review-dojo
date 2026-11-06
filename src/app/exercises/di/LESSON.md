# DI architecture: a lesson before the exercises

By v17 you had already moved from constructor parameters to `inject()`, from `NgModule` providers to standalone
`provideX()` functions, and maybe from `forRoot()` to route-level `providers`. The mechanics you learned still hold. What
a staff-level review adds is a habit: for every provider, ask how many instances exist, who can see each one, and how
long it lives. Most DI bugs are a wrong answer to one of those three questions, and they compile without a warning.

How to use this lesson:

- Read one chapter, then do its exercise. Each chapter assumes you finished the previous exercise.
- The examples use a library app on purpose: books, members, loans and shelves. The lesson gives you the rules; the
  exercise asks you to find where they are broken.
- Every chapter ends with review questions. Some point at the exercise, others ask you to apply the rule to a new case.

### Grading DI findings

This is a Part 2 topic, so you also grade what you find with the README's labels: **blocking**, **should-fix**, **nit**,
**question**. Grade a provider defect by who pays for it, and when:

- A crash on first use, in your app or in a consumer's, is loud. Someone will notice before users do, or users will hit
  it at once. It blocks, because the feature does not work.
- A silently wrong instance (two objects where everyone expects one, or one where everyone expects their own) is worse
  than a crash, because nobody notices. Data goes to a place nobody reads, or appears where it does not belong. It blocks
  as soon as users can see the consequence.
- An API that works but is easy to misuse costs every future consumer a little. That is usually should-fix: cheap now,
  expensive once ten teams have copied the workaround.
- A provider whose intent you cannot tell (an unexplained second registration that is harmless today) is a question. Ask
  for the reason, and for a comment that records it.

## Chapter 0: what moved since Angular 17

### `@Service()`

Angular 22 adds a decorator for services. Its options, as declared in `@angular/core`'s types:

| Form | Meaning |
|------|---------|
| `@Service()` | Provided automatically in the root injector. One instance for the app, created on first use. |
| `@Service({ autoProvided: false })` | Not provided anywhere. It exists only where a `providers` array lists it; asking for it elsewhere throws `NullInjectorError`. |
| `@Service({ factory: () => … })` | Provided automatically, and the factory builds the value. |

Two compiler rules come with it: a `@Service` class cannot take constructor parameters (use `inject()` in fields), and it
cannot carry another Angular decorator. `@Injectable({ providedIn: 'root' })` still works and you will meet both in real
code. According to the README, `ng generate service` now emits `@Service()`, with `--injectable` for the old form.

`@Service()` with no options means app-wide singleton, exactly like `providedIn: 'root'`, so the same scope questions
apply to it.

### Provider functions replaced the initializer tokens

| v17 | v22 |
|-----|-----|
| `{ provide: APP_INITIALIZER, multi: true, useFactory: … }` | `provideAppInitializer(() => …)` (the token is deprecated since v19) |
| `{ provide: ENVIRONMENT_INITIALIZER, multi: true, useValue: … }` | `provideEnvironmentInitializer(() => …)` (deprecated since v19) |

The new functions run their callback in an injection context, so `inject()` works inside them.

### What stayed, and what you may have missed

- `inject(token, { optional, self, skipSelf, host })` takes an options object (chapter 1 explains the flags). The
  parameter decorators (`@Optional()` and friends) still exist for constructor injection.
- `makeEnvironmentProviders([...])` returns `EnvironmentProviders`: providers that can go into `bootstrapApplication`,
  `ApplicationConfig` or a route's `providers`, and that a component's `providers` array rejects at compile time.
- `runInInjectionContext(injector, fn)` and `assertInInjectionContext(fn)` for code that must call `inject()` later.
- `createEnvironmentInjector(providers, parent)` builds an environment injector by hand, for features loaded
  dynamically outside the router.
- `DOCUMENT` is exported from `@angular/core`.

## Chapter 1: scope, lifetime and injection context (exercise 01)

### Do you need an injectable at all?

Dependency injection does three jobs. It separates creating a thing from using it, it controls how long the thing lives
and who shares it, and it lets someone else replace it: a test with a fake (`{ provide: Catalogue, useValue: fake }` or
`TestBed.overrideProvider`), a platform (browser or server), or a consumer with its own configuration. When none of those
jobs is needed, an injectable is ceremony.

| What you have | Simplest home | When to move up |
|---------------|---------------|-----------------|
| A pure calculation (late fee from days overdue) | A plain function or a `const` exported from a module | Never, unless it needs injected data. |
| State that one component owns | A `signal()` or `model()` in that component | When other components must share it. |
| Shared state, or logic that needs other services | An injectable class | When scope or replacement matters, read on. |
| A value someone must be able to replace (configuration, a platform API) | An `InjectionToken` | Only when a replacement really exists. A token nobody overrides is indirection. |

### The problem

The number of instances of a service is invisible in the code that uses it. `inject(X)` looks the same whether it returns
one object for the whole app or a fresh one per component. Get the number wrong in one direction and unrelated widgets
share state. Get it wrong in the other and every widget builds its own cache, the network tab fills with duplicate
requests, and the "shared" data is not shared. Neither mistake fails to compile, and both pass a demo that shows one
widget.

### The mental model: an injector tree

Every `inject()` call is a question asked at a point in a tree. Angular starts at the nearest injector and climbs until
one of them has a provider for the token. Two kinds of injector matter:

- Environment injectors: the root one created by `bootstrapApplication`, plus one per route that has `providers`
  (chapter 3). A provider here gives one instance for everything below it.
- Node injectors: one per component or directive instance that has `providers` (or `viewProviders`). A provider here gives
  one instance per component instance, visible to that component's descendants.

The climb only goes up. A parent never sees what a child provides, and siblings never see each other's providers.

Visible to descendants is a tool of its own. The library's book page shows review threads, and each thread has nested
pieces that need the thread's state without passing it through every input:

```tree
Root environment injector
  CoverCache [one for the app]
  BookPage
    ReviewThread first [providers ThreadContext]
      ThreadContext [instance 1]
      ReplyList
      ReplyBox
    ReviewThread second [providers ThreadContext]
      ThreadContext [instance 2]
      ReplyList
      ReplyBox
```

```ts
@Component({
  selector: 'app-review-thread',
  providers: [ThreadContext],
  template: `<app-reply-list /> <app-reply-box />`,
})
export class ReviewThread {}

@Component({ selector: 'app-reply-box', template: `...` })
export class ReplyBox {
  // climbs to the nearest ReviewThread and gets that thread's context
  private readonly thread = inject(ThreadContext);
}
```

### `providers` and `viewProviders`

A component can also receive content from outside, through `<ng-content>`. The two arrays differ in who sees them:

| Array | Visible to | Not visible to |
|-------|-----------|----------------|
| `providers` | The component, its own template, and content projected into it | Its ancestors |
| `viewProviders` | The component and its own template | Content projected into it from outside |

Use `viewProviders` when a service is an implementation detail of the component's own view and projected content from
the parent should keep resolving from higher up.

### Controlling the climb

The options of `inject()` change where the search starts and stops:

| Option | Effect | Typical use |
|--------|--------|-------------|
| `{ self: true }` | Look only in the current node's own injector | A directive that requires a sibling directive on the same element |
| `{ skipSelf: true }` | Start at the parent | A nested component that wants its parent's instance of the same service, such as a nested menu |
| `{ host: true }` | Stop at the host component | Directives that must not reach past the component they live in |
| `{ optional: true }` | Return `null` instead of throwing when nothing is found | Collaborators that may be absent |

When a lookup "climbs too far" and picks up an instance from somewhere unexpected, these flags are how the code says how
far it meant to go.

### Scope and lifetime

| Kind of state | Lifetime it needs | Where it is provided |
|---------------|-------------------|----------------------|
| API clients, caches, configuration, telemetry | The app | Root: `@Service()` or `providedIn: 'root'` |
| State of one widget instance, or one subtree | That instance | The component's `providers` |
| Shared by several Angular applications on one page (micro-frontend hosts) | The page | `providedIn: 'platform'`, rarely needed |
| Feature areas | See chapter 3 | Route `providers` |

Scoping too narrowly is a real bug as well. If `CoverCache` were listed in each book card's `providers`, every card would
get its own empty cache, and a page of forty books would download covers that another card already had.

Services provided on a component are destroyed with it, and they can clean up: implement `ngOnDestroy`, or
`inject(DestroyRef).onDestroy(() => …)`. A root service lives until the app is destroyed, so a timer or socket it opens
runs for the whole session unless it stops itself.

### Injection context

`inject()` works only while Angular is creating something, or inside code that Angular runs on purpose with an injector
attached. That window is the **injection context**:

- field initializers and the constructor of a class Angular creates;
- provider factories (`useFactory`, `InjectionToken` factories, `@Service({ factory })`);
- the callbacks of `provideAppInitializer`, `provideEnvironmentInitializer`, functional guards, resolvers and
  interceptors;
- `runInInjectionContext(injector, fn)`.

Event handlers, `subscribe` callbacks, timers, and the rest of an `async` method after its first `await` all run later,
outside it. Calling `inject()` there throws `NG0203`, and the code after the call does not run.

The trap often hides inside a helper. Teams write small `injectX()` functions so components can share a lookup:

```ts
export function injectBookId(): Signal<number> {
  assertInInjectionContext(injectBookId); // clear error message if misused
  const route = inject(ActivatedRoute);
  return toSignal(route.paramMap.pipe(map((p) => Number(p.get('id')))), { requireSync: true });
}

export class BookPage {
  protected readonly bookId = injectBookId(); // fine: a field initializer

  protected async refresh() {
    await this.api.ping();
    const id = injectBookId(); // NG0203: this line runs after an await, outside the context
  }
}
```

The name hides the `inject()` inside, so the rule to remember is "anything called `injectX` belongs in a field".
`runInInjectionContext(injector, fn)` is the escape hatch when something must be created later; when you see it, ask
whether the dependency could have been resolved in a field instead.

### How bad is it?

Use the intro's reasoning. Two examples from the library app:

- **`CoverCache` provided per book card.** Nothing on screen is wrong; the cost is duplicate downloads. Who pays: users on
  slow connections, and the image server. **Should-fix**, with the request count in the comment.
- **A root service that starts a polling timer in its constructor and never stops it.** Harmless with one poll a minute,
  a battery and bandwidth problem at one a second. Grade by the numbers: **question** first ("what stops it?"), then
  **should-fix** once the cost is known.

### Review questions

- For each service: if the page showed this component twice, how many instances would exist, and does the state need
  that many?
- Who else can reach this instance by climbing the tree? Is everyone who can reach it supposed to share it?
- For each `inject()` call, including those hidden in `injectX()` helpers: on which line does it run, and is that line
  inside an injection context?
- Would this class be simpler as a function, a component signal or a token?

**Now do exercise 01.**

## Chapter 2: provider recipes and feature APIs (exercise 02)

### The problem

Writing a feature for other teams changes what "it works" means. In your own app you know every token and every
`provideX()` call. A consumer knows only your public function and its documentation. A consumer must be able to use the
feature knowing only that function, and to configure or replace its parts in a test without reading your source. Provider
mistakes break that promise in the consumer's app, where you are not looking.

### The mental model: a provider is a sentence

Each provider tells the injector: "when someone asks for this token, give them that". The recipe decides what "that" is.

| Recipe | Gives | Instances |
|--------|-------|-----------|
| `SomeClass` (short for `{ provide: SomeClass, useClass: SomeClass }`) | A new instance of the class | One per injector with this provider |
| `{ provide: T, useClass: Impl }` | A new instance of `Impl` | A new one, even if `Impl` is also provided elsewhere |
| `{ provide: T, useValue: v }` | `v` itself | The value you passed |
| `{ provide: T, useFactory: () => … }` | What the factory returns | One per injector; the factory runs in an injection context |
| `{ provide: T, useExisting: Other }` | Whatever the injector gives for `Other` | None of its own: an alias |

Try the table on a case. The library app has an abstract `Notifier` that features depend on, and a `SocketNotifier` that
holds a WebSocket to the notification server. Some code injects the abstraction, and the admin console injects the
concrete class to show the connection status:

```ts
providers: [
  SocketNotifier,
  { provide: Notifier, useClass: SocketNotifier },
]
```

How many sockets exist? What does the admin console report on, and what do the other features use? Which recipe in the
table gives one object behind two tokens? And when would two objects be exactly what you want?

### Replace or collect

Providing the same token twice in one injector means the last registration wins. That is how overrides work, and it is
often the point: a library provides a default, and the app provides the same token again to replace it.

`multi: true` changes the meaning to "collect". The library's global search gathers sources from features that do not
know about each other:

```ts
export const SEARCH_SOURCES = new InjectionToken<SearchSource[]>('SEARCH_SOURCES');

// in the catalogue feature
export const provideCatalogSearch = () =>
  makeEnvironmentProviders([{ provide: SEARCH_SOURCES, multi: true, useValue: catalogueSource }]);

// in the events feature
export const provideEventsSearch = () =>
  makeEnvironmentProviders([{ provide: SEARCH_SOURCES, multi: true, useClass: EventsSource }]);

// inject(SEARCH_SOURCES) -> [catalogueSource, an EventsSource], in registration order
```

The array follows registration order, so when order matters (which source's results come first), the order of the
`provideX()` calls is part of the behaviour.

> [!WARNING]
> Mixing multi and regular providers for one token in the same injector throws "Cannot mix multi providers and regular
> providers", but only in development mode (the check is guarded by `ngDevMode`). In a production build the outcome depends on
> the order: a later regular provider silently wins, and a later multi provider crashes. A mistake here can pass a production smoke test and still be wrong.

### Required, defaulted or optional

An `InjectionToken` can be required or carry its own default. The choice decides what happens when nobody provides it:

| Shape | Nobody provides it | Good for |
|-------|--------------------|----------|
| `new InjectionToken<string>('API_BASE_URL')` | `inject()` throws `NullInjectorError` when the code runs | Values with no sensible default: failing fast is the feature. |
| `new InjectionToken<number>('PAGE_SIZE', { factory: () => 20 })` | The factory's value. The token is provided in root by default. | Settings that should work out of the box and stay overridable. |
| `inject(SOME_TOKEN, { optional: true })` | `null`, and the consumer handles it | Truly optional collaborators. |

### A feature's public API is a function

The usual shape is a typed `provideX(options)` that returns `EnvironmentProviders`:

```ts
export function provideCatalogue(options: { pageSize?: number } = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PAGE_SIZE, useValue: options.pageSize ?? 20 },
    // ...the feature's other providers
  ]);
}
```

`makeEnvironmentProviders` hides the provider list behind one value, and makes TypeScript reject the result in a
component's `providers` array, where the feature would be re-created per component instance. Read a feature's function
from the consumer's side: everything the feature injects has to come from somewhere the consumer will actually have.

### How bad is it?

Use the intro's reasoning. Two examples from the library app:

- **An optional `RENEWAL_REMINDERS` token whose default factory returns `{ enabled: false }`.** Nothing crashes, and in
  production no member ever gets a reminder, because no app knew it had to switch them on. The feature looks finished
  and does nothing. **Blocking** if reminders were the point of the release, otherwise a **question** about the default.
- **A `provideCatalogue()` function that also registers an app-wide HTTP interceptor adding a catalogue header to every
  request.** Every consumer gets behaviour they did not ask for, on requests that have nothing to do with the catalogue.
  **Should-fix**: move the interceptor behind an option, or scope it to the catalogue's own requests.

### Review questions

- For one `provideX()` function in the exercise, read each provider as a sentence: which token, which recipe, how many
  times?
- Could a consumer use this feature, and replace any of its dependencies in a test, without knowing an internal token?
- Where a token is registered more than once: is the intent "replace" or "collect", and what happens in a production
  build if the code says the other one?
- Where two tokens or two classes meet: does anyone need them to be the same object?

**Now do exercise 02.**

## Chapter 3: injectors in a routed, lazy application (exercise 03)

### The problem

Moving a feature into a lazy-loaded route is supposed to change when its code loads, nothing else. When it also changes
which instances the feature gets, the area behaves like a separate application inside the real one, and the difference is
often found in production by another team, because nothing in the area's own tests looks wrong.

### Route providers create environment injectors

A route with a `providers` array gets its own environment injector, created the first time the route is matched (even if
a guard then rejects the navigation) and shared by that route and its children. Components rendered by those routes climb
their node injectors first, then the route's environment injector, then its parents up to root:

```tree
Root environment injector [app providers]
  members route environment injector [route providers]
    MembersShell [component providers]
      profile route
        ProfilePage [component providers]
      loans route
        LoansPage [component providers]
```

The lifetime is the surprising part. A route's injector is created the first time the route is matched and, by default,
lives for the rest of the app, like root. Route scope controls who can see the instance, not how long it lives. To get rid
of it on exit, opt in with `provideRouter(routes, withAutoCleanupInjectors())` (stable since 22.2, replacing the
experimental name; a custom `RouteReuseStrategy` must also allow it in `shouldDestroyInjector`, while the default one does). A service provided by a component, by contrast, dies with
that component.

### Re-providing creates another instance

A class that is auto-provided in root (`@Service()`, `providedIn: 'root'`) and also listed in a lower `providers` array
exists twice. Which one you get depends on where you ask from.

A neutral example: a "Lend a copy" dialog component lists `LoanBasket` in its own `providers`, while `LoanBasket` is also
auto-provided in root. Code inside the dialog adds a book to the basket. Which copy does the page that opened the dialog
see? And which did the author mean?

Sometimes a second instance is exactly the intent. Then the lower provider deserves a one-line comment, because the next
reader cannot tell intent from accident.

### `HttpClient` below the root

`provideHttpClient()` configures an `HttpClient` in the injector where it is called. In a child injector it configures a
new, independent client for that subtree, with its own interceptor chain and backend.

Independence is sometimes exactly right. An upload area that talks to a separate media server might want `withXhr()` for
upload progress events and its own credentials, and must not receive the main API's auth header. Sometimes it is not, and
the area should add to the app's HTTP setup instead of replacing it. The HTTP package has a way to chain a child client to
its parent: look through the `HttpFeature` functions exported by `@angular/common/http` and read their documentation.

### Dynamic features

Not every feature arrives through the router. A plugin loaded at runtime, or a widget created from a CMS description, can
get its own environment injector with `createEnvironmentInjector(providers, parentInjector)`. Everything above applies:
the new injector climbs to its parent, and whatever it re-provides exists twice. It also has to be destroyed by whoever
created it (`injector.destroy()`).

### How bad is it?

Use the intro's reasoning. Two examples from the library app:

- **A lazy area that provides its own `TitleStrategy`, so pages inside it lose the app-wide title suffix.** Users see
  slightly different tab titles; screen reader users hear them. Nobody loses data. **Should-fix**, unless the suffix
  carries meaning such as an environment name, then higher.
- **A plugin injector created with `createEnvironmentInjector` and never destroyed.** Each time the plugin reloads, its
  timers and sockets stay alive. With one reload a day, a **question**; with one per navigation, **blocking** for long
  sessions.

### Review questions

- Draw the injector tree for the area: root, every route with `providers`, every component with `providers`. How many
  times is each service provided?
- For each pair of components that must agree on some state: do they reach the same node of the tree?
- For each instance provided below root: who can see it, and how long does it actually live?
- A new interceptor is added in root next month. Which areas of the app will it miss, and would anyone notice?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch. Compare its severity table with yours,
then its fix. Then write the PR comment in a few sentences, each starting with its label. Say the impact in terms of
instances and data ("the area writes to a second copy that the rest of the app never reads"), and say in one line what you
checked and found fine, such as an intended re-provide.

> [!NOTE]
> After exercise 03: the feature that chains a child `HttpClient` to its parent is `withRequestsMadeViaParent()`. The
> request runs through the child's interceptors first, then the parent's, and several levels can each use it. It cannot
> be combined with `withFetch()` or `withXhr()` in the same `provideHttpClient()` call.
