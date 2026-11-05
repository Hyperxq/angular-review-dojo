# HTTP and error architecture: a lesson before the exercises

In a v17 app you probably had an `HttpInterceptor` class or two, a `catchError` here and there, and a toast service that
somebody wired up during a crunch. Errors were something you handled when a ticket made you. This track asks you to treat
them as part of the design: every failure travels a path from the network to a human, and at each step some code decides
whether to pass it on, translate it, show it, or drop it. Most production incidents in this area come from one of those
decisions being made in the wrong place.

This is Part 2 of the dojo, so finding the defect is half the work. For every finding you also decide how bad it is
(blocking, should-fix, nit, or question) and write the comment you would leave on the pull request. Each chapter ends with a
short section on how to say it.

How to use the lesson:

- Read one chapter, then do its exercise. Each chapter assumes the previous exercise is done.
- The examples come from a library app (books, members, loans, holds) and use problems of their own, on purpose. The
  lesson teaches each tool on a different case from the exercise; recognising the exercise's case is your part.
- Ask the review questions at the end of each chapter while you read the exercise code.

## Chapter 0: what moved since Angular 17

### Fetch is the default backend

In v17 `HttpClient` sent requests through `XMLHttpRequest`, and you opted in to the Fetch API with `withFetch()`. In 22.2.2
`FetchBackend` is the default and `withFetch()` is deprecated with the note "`withFetch` is not required anymore". If you need
upload progress events, which fetch cannot report, there is `withXhr()`.

```ts
provideHttpClient(withInterceptors([requestIdInterceptor, loadingBarInterceptor]));
```

> [!NOTE]
> The type definitions warn that XHR on the server is deprecated and planned for removal in Angular 23. On an SSR app,
> `withXhr()` in the server config is a finding.

### Interceptors are functions

Functional interceptors existed in v17, but most codebases still had classes registered through `HTTP_INTERCEPTORS`. In a
v22 codebase the normal form is a function:

```ts
export const requestIdInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Request-Id': crypto.randomUUID() } }));
```

An id generated inside an interceptor identifies one attempt. An id that should follow one user intent (one "borrow" click,
however many requests it causes) has to be created where the intent happens and passed down, for example in an
`HttpContext`. For tracing across services, the W3C `traceparent` header is the standard alternative to a home-made header.

`HttpInterceptorFn` is `(req, next) => Observable<HttpEvent<unknown>>`, and `next` is an `HttpHandlerFn`, the rest of the
chain as one function. You can call `inject()` at the top of the body, because Angular runs interceptor functions in an
injection context. The old class interceptors still work through `withInterceptorsFromDi()`; seeing both styles in one app
is worth a question about which one runs first.

### Resources hold the three states for you

You know `rxResource` from the RxJS lesson. Its sibling `httpResource` (marked `@publicApi 22.0`) builds a GET request from
a signal-driven URL:

```ts
export class MemberPage {
  readonly memberId = input.required<number>();

  readonly member = httpResource<Member>(() => `/api/members/${this.memberId()}`);
}
```

Both give you a `ResourceRef` with these signals and methods:

| Member | Meaning |
|--------|---------|
| `status()` | `'idle'`, `'loading'`, `'reloading'`, `'resolved'`, `'error'` or `'local'` (a value you set yourself) |
| `isLoading()` | `true` while loading or reloading |
| `error()` | the error, or `undefined` |
| `value()` | the current value; **throws** while the resource is in the error state |
| `hasValue()` | `true` when `value()` is safe to read |
| `reload()` | runs the request again |

`httpResource` adds `statusCode()`, `headers()` and `progress()`.

> [!WARNING]
> Because `value()` throws in the error state, a template that reads it before checking `error()` or `hasValue()` turns a
> failed request into a rendering error.

### Timeouts are a request option

`HttpClient` requests accept a `timeout` in milliseconds:

```ts
this.http.get<Branch[]>('/api/branches', { timeout: 8000 });
```

When it expires, the fetch backend aborts the request with a `DOMException` named `TimeoutError`, which reaches the caller
inside an `HttpErrorResponse`. Without a timeout, a request to a server that never answers keeps its spinner turning for as
long as the browser allows.

### Errors that nobody caught

`ErrorHandler` is the same token you knew: Angular calls its `handleError` for errors thrown in templates, event handlers and
lifecycle hooks. Two things are new. `provideBrowserGlobalErrorListeners()` forwards the window's `error` and
`unhandledrejection` events to that handler, so promise rejections that used to vanish now arrive there too. And because the
app is zoneless, there is no Zone catching async errors on Angular's behalf: the global listeners are how they reach you.

## Chapter 1: an error is information (exercise 01)

### The problem

Every error path has three audiences. The member needs to know what happened and what to do next. The desk staff need to
understand what the member is looking at when they come to ask. The on-call engineer needs to learn that something broke,
with enough detail to find it. Code written in a hurry usually serves none of them, and code written with care often serves
only the first. Each layer that touches an error decides what these three people will know.

### Four honest moves

Take one failure and walk it up the layers: HTTP client, interceptors, service, store or resource, component, template.
Each layer has four honest moves:

| Move | When it is right | Library example |
|------|------------------|-----------------|
| Pass it on | The layer has nothing to add. This is the default. | A service method that just calls `http.get`. |
| Translate it | The layer can give the error a better meaning. | A `404` on `/api/books/:id` becomes `BookWithdrawn`. |
| Show it | The layer owns some screen and can tell the user what happened and what to do next. | "Renewal failed. The loan is unchanged. Try again or ask at the desk." |
| Recover | The layer has a fallback that is true, and labels it. | The branch hours from the last successful load, shown with "as of 9:00". |

Anything else is dropping the error. The test for a fallback is whether a user who sees it would believe something false.

Translation is the move reviewers see least often and should ask for more:

```ts
book(id: number): Observable<Book> {
  return this.http.get<Book>(`/api/books/${id}`).pipe(
    catchError((error: unknown) =>
      error instanceof HttpErrorResponse && error.status === 404
        ? throwError(() => new BookWithdrawn(id))
        : throwError(() => error), // everything else passes on unchanged
    ),
  );
}
```

The component can now say "this book was withdrawn" for one case and show a generic failure for the rest.

### Expected failures and unexpected ones

An expected failure is part of the feature: the network drops, the server answers 503, the book was withdrawn, the request
takes too long. The screen that asked for the data is the right place to show it, because only that screen knows what the
user was trying to do. In v22 resources give that screen the vocabulary (`status()`, `error()`, `hasValue()`, `reload()`;
chapter 0). Give requests a timeout too: a spinner with no end is the most dishonest state of all, because it promises an
answer that is not coming.

An unexpected failure is a bug: a `TypeError` in an event handler, a template reading a property of `undefined`. Nobody can
show it well, because nobody planned for it. Where an error ends up depends on where it happens:

| Where the error happens | Where it ends up |
|-------------------------|------------------|
| Inside a `catchError` | Wherever that `catchError` sends it; the layers above see only what it returns. |
| In a resource's `stream` | The resource: `error()` and `status() === 'error'`. |
| Thrown in a template, an event handler or a lifecycle hook | `ErrorHandler.handleError` |
| An unhandled promise rejection or a stray `error` event | `ErrorHandler`, when `provideBrowserGlobalErrorListeners()` is set up |
| A `subscribe` with no error callback | Reported as unhandled, so it also reaches the global listeners |

### What makes an error report useful

An error report is a message to the on-call engineer. It is only worth sending if they can act on it:

| A report must carry | A report must never carry |
|---------------------|---------------------------|
| The release version, so the bug can be tied to a deploy | Tokens, cookies or any other credential |
| The route the user was on | Personal data: names, emails, card numbers, search terms |
| The user action that started it ("renew clicked") | Request or response bodies |
| The request id from chapter 0, to find the server side | |
| The HTTP status, for HTTP failures | |

Report HTTP failures once, at the transport edge (an interceptor sees all of them with their URL and status). Screens only
decide how to show them; a screen that also reports creates duplicates.

### When not to catch

- When you have nothing to add. A `catchError` that logs and rethrows in every service is noise; one place that reports
  is enough.
- When the error is expected and handled. Reporting every `404` as a crash fills the error tracker until people stop looking.
- When the fallback would be false. If you cannot label it honestly, show the failure.

### Saying it in a review

Judge an error-handling finding by what a user believes while the server is down and who on the team finds out. Something
false shown to users, or an incident nobody can see, is in blocking territory. Noise that makes real incidents harder to
see is a real cost with a clear fix, so it is usually should-fix. Wording that could be friendlier is a nit; a choice that
belongs to the product owner is a question.

> **Should-fix:** the new interceptor sends every `404` on `/api/holds` to the error tracker as a crash. A `404` there means
> "this member has no holds at this branch", which is normal, and the on-call dashboard is now 80% expected noise. Decide
> which outcomes are expected for this endpoint and stop reporting those.

### Review questions

- Pick one failure and follow it upward. At each layer, is it passed on, translated, shown, recovered, or dropped? Would any
  "recovery" make a user believe something false?
- For each empty state in this app, list the three things that can produce it.
- After a failure, what is the user's next move, and does the screen offer it? Does every loading state have an end?
- For each kind of error report: who receives it, and what would they need in it to act?

**Now do exercise 01.**

## Chapter 2: the interceptor chain is an onion (exercise 02)

### The problem

Interceptors are policy that nobody sees at the call site. The developer reading `this.http.get('/api/loans')` sees one line
and none of the five things that happen around it. The on-call engineer reading a trace cannot tell which layer added a
header or a delay. And the team that runs the server receives traffic the client generated on its own, without a user
asking for it. Each of them pays for decisions made in a file they will probably never open.

### Order is direction

`withInterceptors([a, b, c])` builds the chain in the order of the array. A request goes through `a`, then `b`, then `c`, then
the backend. The response comes back the other way.

```flow
Component -> a: request
a -> b: request
b -> c: request
c -> Backend: request
Backend -> c: response or error
c -> b: response or error
b -> a: response or error
a -> Component: response or error
```

From inside `b`, everything below it is a single observable returned by `next(req)`. So the order decides what each layer
observes. The library app has a cache interceptor that answers some `GET`s from memory, and a timing interceptor that reports
how long requests take:

- With `[timing, cache]`, timing sees cache hits as very fast requests. The average looks great and says nothing about the
  server.
- With `[cache, timing]`, timing only sees requests that reach the network, which is what the latency dashboard wants.

Neither order is wrong in general. The order is a decision about what each interceptor observes, and it should be written
down where the array is.

### Eager and lazy work

Any function that returns an observable can do work at two moments: when the function is called, and when the observable
is subscribed. `of(Date.now())` reads the clock when it is called; `defer(() => of(Date.now()))` reads it on every
subscription.

```marbles
eager, repeated:     a-----a-----a--   // of(Date.now()) built once: every subscription sees the same time
deferred, repeated:  a-----b-----c--   // defer(() => of(Date.now())): a new time per subscription
```

When you read any function that returns an observable, sort its work into the two moments; the RxJS lesson's chapter 5 ("cold, hot, and shared") covers what each means
for subscribers.

### A retry is a request nobody asked for

Look at a retry from the server's side. It is a second request the user did not ask for, sent at the moment the server is
already struggling. Whoever designs a retry has to answer one question: when the second copy lands, who pays?

- If the request reads data, usually nobody: the server answers twice.
- If it changes data, the second copy may change it again. The member pays (two loans, two fines), and support pays to
  untangle it.

HTTP methods and status codes are defined by what they promise (RFC 9110 has the definitions). Work out from those
promises which requests leave the server unchanged when sent twice, and which failures could go away on their own. Some
`5xx` never will: `501 Not Implemented` and `505 HTTP Version Not Supported` give the same answer on every attempt.

When a write must be repeatable (an offline queue that sends writes when the connection returns, for example), the usual
tool is an **idempotency key**. The client generates an id per intent (one per "borrow this book" click, not one per
request) and sends it in a header such as `Idempotency-Key`. The server stores the result of the first request with that key
and returns the same result for any repeat.

### Retries multiply load

During an outage, every client retries at once. Three attempts per request means three times the traffic, aimed at a server
that was already failing under one. Three ideas keep retries from making outages worse:

- Jitter: add a random part to each delay, so clients that failed together do not come back together.
- `Retry-After`: when the server says how long to wait (often with `429` or `503`), wait that long.
- Retry budgets: cap retries at a small share of normal traffic, so a widespread failure turns into fast errors instead of
  a flood.

The RxJS lesson's chapter 4 shows how `retry` resubscribes; the policy is the part this chapter cares about.

### When not to use an interceptor

- For a policy that differs per call. A behaviour that applies to one endpoint belongs at the call site, where the reader of
  that call can see it.
- When the order between interceptors matters and nobody wrote down why. Add the comment or a test first.

### Saying it in a review

Judge transport findings by what happens to the server and to the member's data. Anything that can change data twice, or
show a member something that did not happen, is in blocking territory. For an ordering problem, describe what the member sees
first and the fix second, because "interceptor B should come before C" means nothing to a reader who has not drawn the
onion.

> **Should-fix:** `loadingBarInterceptor` calls `bar.stop()` in a `tap` on success only. When a request fails, the bar keeps
> spinning until the next successful one. Use `finalize(() => bar.stop())` so it stops on success, error and cancellation.

### Review questions

- For each interceptor: what does it need to observe, and is it placed where it observes that?
- Pick any function in the chain that returns an observable. Which of its work happens when it is called, and which when it
  is subscribed? Would a reader of the call site guess right?
- For every request the client can send without a fresh user action: who pays when the second copy lands, and how would
  the server know it is a copy?

**Now do exercise 02.**

## Chapter 3: shared work and the session boundary (exercise 03)

### The problem

This chapter is about work that outlives the code that started it. Work shared between callers decides how much load the
servers carry and what every caller sees when that work fails. Work tied to a signed-in person decides privacy: whatever
outlives the person's session belongs to someone who is no longer there. Neither problem shows up much in development, where
there is one caller and one person at the keyboard.

### Deduplicating work: the options

When several callers need the same piece of async work, you have several ways to run it once. They differ in what they do
with late callers, errors and cancellation:

| Option | What it shares | Watch out for |
|--------|----------------|---------------|
| `share()` | One run for the callers subscribed at the same time. | Its lifetime rules (RxJS lesson, chapter 5) decide what late callers and leaving callers get; read them before relying on it. |
| `shareReplay` | The result, to everyone who comes later. | It is a cache: decide how long the value stays true and when it must be cleared. |
| A memoized promise (`this.pending ??= fetchHours()`) | One run; every caller awaits the same promise. | Eager and not cancellable. A rejected promise stays rejected unless you clear it. |
| `exhaustMap` on a trigger stream | One run per burst of triggers; triggers during the run are dropped. | Only callers that listen to the output get the result; the dropped triggers get nothing. |
| A cross-tab lock (`navigator.locks.request(name, callback)`) | One run across all tabs of the same origin. | Async and browser-only; every tab must agree on the lock name and on how to share the result. |

None of these is the default. Ask which callers exist, when they arrive, and what each of them must see on failure, then
pick the option whose behaviour matches.

### The session is a security boundary

When a member signs out, two lists matter:

- What must stop: requests in flight, polling, WebSocket connections, timers that will write state when they fire.
- What must be cleared: stores, `shareReplay` buffers and other caches, `httpResource` and `rxResource` values, anything
  written to `localStorage` or `sessionStorage` for that member.

A response that arrives after sign-out is a data leak on a shared terminal: it can put the previous member's loans back into
a store that was just emptied.

How does an app make all of that happen reliably? The useful question about any design is: when someone adds a feature next
year, what makes that feature's state die at sign-out, the structure or the author's memory? Two structural answers, with
their costs:

- Keep per-member state in an injector that is created at sign-in and destroyed at sign-out. Cleanup comes from the
  structure, but the scoping has to be designed in from the start.
- Reload the page on sign-out. Crude, and it costs a full load, but nothing in memory survives. On public terminals it is
  often the honest answer.

Designs that leave cleanup to each feature can work too; weigh what happens on the day one feature forgets.

### Behaviour flags and credentials are different things

`HttpContext` carries per-request intent through interceptors. It suits behaviour flags, values that change how an
interceptor treats one request:

```ts
export const CACHE_TTL_MS = new HttpContextToken<number>(() => 0);

this.http.get('/api/branches', { context: new HttpContext().set(CACHE_TTL_MS, 60_000) });
```

The token's constructor takes a function that returns the default, so requests that never set it get `0`.

Credentials are not a behaviour flag. An interceptor that attaches a credential must decide by an allow-list of origins it
trusts, never by an opt-out flag: with an opt-out, every request nobody thought about, including those to third-party
services, carries the credential by default. The security lesson covers this in depth.

### When not to use them

- Do not deduplicate work whose callers need independent results (different parameters, or different cancellation).
- Do not add an `HttpContextToken` for something only one call site cares about; that call can simply not use the feature.
- Do not rely on clearing one store at sign-out when a dozen others exist. Prefer a structure that ends them all.

### Saying it in a review

Concurrency findings are hard to see in a diff, so put the timeline in the comment: "three components ask at the same
millisecond; each one runs this line; the server sees three calls". Severity follows the consequence: data reaching the
wrong person, lost work, or load on a server with no upper bound are blocking. Problems that cross browser tabs cannot be
proven by a unit spec; raise them anyway, and say so.

### Review questions

- List every piece of state that must die when the user changes. Which of it can a pending response resurrect?
- When several parts of the app need the same async work at once, which deduplication option fits, and what does it do with
  errors and with callers who arrive late?
- For every interceptor that attaches credentials: which origins receive them, and what decides that?
- If two tabs of the app do the same work at the same time, what happens?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch. Compare your severities with the table there,
and defend any disagreement in writing: the table is a model answer, not ground truth. Then compare your PR comment with
"What a reviewer should say in the PR comment". If your comment names a rule ("errors must be reported") where it could
name an impact ("the on-call dashboard is mostly expected noise, so real incidents get missed"), rewrite it.
