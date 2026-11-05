# Testing: a lesson before the exercises

In v17 you ran `ng test`, Karma opened a browser, Jasmine printed a column of green dots, and a green build meant the
feature worked. These three exercises start from the opposite situation: the build was green and the feature was broken
in production. The defect lives in the **tests**. The production code has bugs too, but your first job is to explain why
the suite let them through.

How to use it:

- Read one chapter, then do its exercise. Each chapter assumes the previous exercise is done.
- Every exercise has an `*.audit.spec.ts` file. It describes what the product team asked for and it is red on `main`.
  Do not start there. Read the existing spec first and ask what it really proves.
- The examples use a library (books, members, loans, shelves). The exercises use a shop.
- Each chapter ends with **review questions**. They are meant for any suite you review, not only these.

### What tests are for, and what they cost

A test suite buys two things: the confidence to change code without breaking it, and an early warning for the
regressions users would otherwise find. It also costs something. Every test is code to maintain, and a test tied to
the way something is written makes every refactor slower. A test is worth writing when the behaviour it protects would
hurt someone if it broke and is likely to be touched again. A test that protects nothing still costs its maintenance.

Coverage does not tell you which kind you have. It measures which lines **ran** during the tests, not which behaviour was
**checked**. A test that runs a whole component and asserts nothing raises coverage and is invisible to it. The classic
`it('should create')` proves only that the constructor does not throw; keep it on purpose, or delete it on purpose.

Pick the level that matches the risk:

| What can break | Cheapest test that can see it |
|----------------|-------------------------------|
| A rule in a pure function (a fee, a date calculation) | A plain unit test, no TestBed. |
| A template binding, an input, what a user reads on one component | A component test with the TestBed. |
| A flow across pages, the router, a real server | An end-to-end test. |

Component tests can be **solitary** (every collaborator replaced) or **sociable** (real collaborators you own, only the
outside world replaced). Solitary tests point at the failing unit precisely but break when internals move; sociable tests
survive refactors but a failure can come from several places. Most Angular teams lean sociable and replace only what
sits at the edge of the process.

---

## Chapter 0: what moved since Angular 17

### Karma and Jasmine are gone; Vitest runs through the Angular builder

`angular.json` points the `test` target at `@angular/build:unit-test`, which builds the specs with the same pipeline as
the app and hands them to Vitest 5 running in jsdom. You still type `ng test` (here `npm test`), with two options you
will use all the time:

```bash
npm test -- --watch=false --include='src/app/exercises/testing/01-stock-badge/**/*.spec.ts'
npm test -- --watch=false --filter="part of a test name"
```

Runner defaults that matter for every exercise in this folder (read from the installed builder and Vitest):

| Default | What it means for you |
|---------|-----------------------|
| `globals: true` | `describe`, `it`, `expect` and `vi` exist without imports, as Jasmine's did. |
| `isolate: false` | Spec files share one environment per worker "to align with the Karma/Jasmine experience". A value left in `localStorage`, a cookie, or a stubbed global can be seen by the next **file**, not only the next test. |
| TestBed cleanup hooks | The builder registers `beforeEach`/`afterEach` hooks that reset the TestBed around every test. Each test gets a fresh injector, but only for what it gets **from** the TestBed. |
| Mocks between files | Vitest calls `vi.restoreAllMocks()` after each file. Nothing restores fake timers. |
| Advanced options | Anything else (shuffling, custom reporters) goes into a Vitest config file passed with the builder's `runnerConfig` option; `ng test` has no flag for it. |

### Jasmine to Vitest, the short dictionary

| Jasmine (v17) | Vitest (now) |
|---------------|--------------|
| `jasmine.createSpy()` | `vi.fn()` |
| `jasmine.createSpyObj('Api', ['get'])` | an object literal: `{ get: vi.fn() }` |
| `spyOn(obj, 'm').and.returnValue(x)` | `vi.spyOn(obj, 'm').mockReturnValue(x)` |
| `.and.callFake(fn)` | `.mockImplementation(fn)` |
| `jasmine.clock().install()` / `tick(ms)` | `vi.useFakeTimers()` / `vi.advanceTimersByTime(ms)` |
| `jasmine.clock().uninstall()` | `vi.useRealTimers()` |
| `jasmine.objectContaining({...})` | `expect.objectContaining({...})` |
| `expectAsync(p).toBeResolved()` | `await expect(p).resolves...` |
| `it('...', done => { ...; done(); })` | an `async` test; Vitest throws "done() callback is deprecated, use promise instead" |

Two Vitest additions you did not have: `expect.assertions(n)` and `expect.hasAssertions()` fail a test if fewer
assertions ran than expected, and an un-awaited `expect(...).resolves`/`.rejects` is reported as an error instead of
passing silently. One limit of this builder: `vi.mock` of relative imports is not supported, so you replace
dependencies through DI providers, which is the Angular way anyway.

### Fake timers: spies are cleaned up between files, clocks are not

`vi.useFakeTimers()` replaces `setTimeout`, `setInterval`, `Date` and friends for the whole environment. With
`isolate: false` that environment outlives the file, and since nothing restores timers automatically, a test that turns
them on and never off hands a frozen clock to whatever runs next. The failure then appears far from its cause, as a
timeout or a date from 1970 in an unrelated test. Tie the undo to the test, so it runs even when the test fails:

```ts
vi.useFakeTimers();
onTestFinished(() => vi.useRealTimers()); // or vi.useRealTimers() in an afterEach
```

The same applies to `vi.stubGlobal` (Vitest's `unstubGlobals` config option undoes those after each test).

### Zoneless TestBed

The app has no zone.js, and neither do the tests. `fakeAsync`, `tick` and `flush` still exist in `@angular/core/testing`,
but the installed types say: "This API requires Zone.js and cannot be used with the Vitest test runner". Time is
controlled with Vitest's fake timers.

Rendering is scheduled, as in the app. When zoneless is enabled, a `ComponentFixture` auto-detects changes by default (the
installed source sets `autoDetectDefault = zonelessEnabled`). Setting an input or a signal marks the view dirty and the
scheduler renders it a moment later, so the DOM is not updated on the line where you made the change:

```flow
setInput or signal.set -> Scheduler: marks the view dirty
Scheduler -> Rendering: runs on a later timer or animation frame
await fixture.whenStable -> Assertion: the DOM now reflects the change
```

| Tool | Use it when |
|------|-------------|
| `await fixture.whenStable()` | The default. Waits for scheduled rendering and pending work such as resources. |
| `fixture.detectChanges()` | You need a synchronous render, for example while fake timers are active. |
| `TestBed.tick()` | Run pending effects and synchronize the UI (it replaces the deprecated `TestBed.flushEffects()`). |

The zoneless scheduler uses `setTimeout` and `requestAnimationFrame` to decide when to render. If a test fakes those,
rendering waits for the test to move the clock, and `whenStable()` can wait with it. Under fake timers, render with
`fixture.detectChanges()` or fake only what you need (`vi.useFakeTimers({ toFake: ['Date'] })`).

### Signal inputs and HTTP testing

Signal inputs are read-only from the outside. A test gives them a value the way a parent template would:

```ts
const fixture = TestBed.createComponent(LoanCard);
fixture.componentRef.setInput('loan', { id: 7, title: 'Dune', dueDate: '2026-03-01' });
await fixture.whenStable();
```

`HttpClientTestingModule` is deprecated ("Add `provideHttpClientTesting()` to your providers instead"). The modern setup
is two providers, the real client and the testing backend:

```ts
TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
```

---

## Chapter 1: a test that cannot fail (exercise 01)

### The problem

A green build is a promise to the people downstream. The release manager ships because CI passed, the next developer
refactors because the tests will catch a mistake, and the reviewer skims the spec because it exists. Every one of them is
let down by a test that would still pass if the feature were deleted. A missing test at least shows up in coverage and in
review; a vacuous one looks like protection, and nobody looks at it again until production does.

### The method: break one line, see what goes red

A test is a claim: "if this behaviour broke, I would turn red". The only way to check the claim is to break the code and
watch. Pick one line of production code, change it (flip a comparison, return a constant, delete a branch), run the
suite, and note which tests fail. A line whose change turns nothing red is unprotected, whatever the coverage report
says. Mutation testing tools (Stryker, for example) do this for every line; in a review you do it in your head, one line
and one assertion at a time.

Run the method on the test as well as on the code. Read each test and ask: what is the most wrong behaviour that would
still pass it? There are several ways a test can make no claim at all. They come from three places: the matcher (it
accepts almost anything), the timing (it reads a result before it exists), and the control flow (the assertion is
skipped). Here is one example of the last kind, to show how innocent it looks:

```ts
it('rejects a renewal past the limit', () => {
  try {
    renew(loanAtLimit);
  } catch (error) {
    expect((error as Error).message).toContain('limit');
  }
});
```

If `renew` stops throwing, the `catch` never runs, no assertion runs, and the test passes. The direct form says what is
expected and fails when it does not happen: `expect(() => renew(loanAtLimit)).toThrow(/limit/)`. Where a skipped path is
hard to avoid, `expect.assertions(n)` turns "nothing was checked" into a failure.

The exercise has more than one such test, of more than one kind. Find them with the method, not by pattern-matching.

### Rules have edges

A rule in a ticket ("members with three or more late returns pay a deposit") has an edge, and off-by-one bugs live on it.
A value from the middle of the range proves the rule exists; only the values just below and just above the edge prove
where it is. When you read a test of a rule, find the edge in the ticket and check that the test sits on both sides of it.

### Review questions

- Pick the line of production code most likely to break next quarter: which test names it?
- If you deleted this test, what bug could ship?
- What is the most wrong behaviour that would still pass this test?
- Does the test name read as a requirement a product owner would sign?

**Now do exercise 01.**

---

## Chapter 2: test doubles and where to put them (exercise 02)

### The problem

The bugs that cost the most sit in the seams: between your code and a library, between a component and its services,
between the app and the network. A test that replaces a seam with something simpler stops checking that seam, and the
people who find the difference are users.

### The kinds of double

| Double | What it does | Example |
|--------|--------------|---------|
| Dummy | Fills a parameter nobody uses. | `null` for a logger the code path never touches. |
| Stub | Returns canned answers. | A clock that always says "Friday 10:00". |
| Spy | Records how it was called. | `vi.fn()` checked with `toHaveBeenCalledWith(...)`. |
| Mock | A spy with expectations set up front. | Rare in Vitest style; usually a spy plus assertions. |
| Fake | A working, simplified implementation. | An in-memory repository; `provideHttpClientTesting()`. |

Each double removes a piece of real behaviour from the test. Choose it by asking which behaviour the test is about, and
make sure that piece stays real.

### Angular's seams are providers

In Angular, the place to swap a collaborator is the injector. Take a "due today" label that depends on the current date.
Reading `new Date()` inside the component makes the test depend on the day it runs. Injecting a clock makes time an input:

```ts
export const CLOCK = new InjectionToken<() => Date>('CLOCK', { factory: () => () => new Date() });

// in the component
private readonly now = inject(CLOCK);

// in the test
TestBed.configureTestingModule({
  providers: [{ provide: CLOCK, useValue: () => new Date('2026-03-06T10:00:00') }],
});
```

The stub replaces one thing you own, at a boundary you designed for it, and everything else in the component stays real.
The same goes for a store or a router in a component test: replacing a store you own with a stub is a solitary test
(fine when the store has its own tests); using the real one is a sociable test.

### Don't hand-roll fakes of types you don't own

A classic rule of test design is "only mock types you own". A type you don't own (Angular's `HttpClient`, the
`Router`, a third-party SDK) has behaviour you would have to copy into your double, and your copy will be wrong in
exactly the cases you did not think of. When the owner ships a fake, use it. For HTTP that is
`provideHttpClientTesting()`: it keeps the real `HttpClient`, its interceptors and your operators, and stands in at the
process boundary, the network.

```flow
Test -> CatalogService: calls a public method
CatalogService -> HttpClient: the real client from provideHttpClient
HttpClient -> Interceptors: everything registered with withInterceptors
Interceptors -> HttpTestingController: the owner's fake replaces only the network
HttpTestingController -> Test: lets the test inspect and answer each request
```

### `HttpTestingController` as a tool

| Method | What it gives you |
|--------|-------------------|
| `expectOne(url \| { method, url } \| predicate)` | Asserts exactly one matching request (fails on zero and on two) and returns a `TestRequest`. |
| `expectNone(...)` | Asserts no matching request was made. |
| `match(...)` | Returns every matching request, without asserting. |
| `verify()` | Asserts nothing is left outstanding (by default it also fails on cancelled requests you did not match). |

A `TestRequest` exposes what the code really sent (`req.request.method`, `.params`, `.headers`, `.body`) and lets the test
answer with `flush(body)` or `flush(body, { status, statusText })`. Which of these a suite uses, and where, decides what
it can notice.

### Query the page the way a user reads it

A selector such as `.card > .title-lg` ties a test to the stylesheet: a redesign breaks it although users see no change,
and it misses the changes users do notice, such as a heading that lost its text. Query by **role and accessible name**:
the `heading` named "Dune", the `button` named "Reserve", the element with `role="status"`. These are contracts users and
assistive technology rely on. The dojo ships a small helper in `src/app/core/a11y-queries.ts`:
`getByRole(root, 'heading', { name: 'Dune' })` throws unless exactly one match exists, and lists the names it found when
it fails. Decorative details have no role; for those, a rare `data-testid` is acceptable.

### Review questions

- For each double: which real behaviour does it remove, and is that the behaviour the test's name promises?
- Is any double a hand-written copy of a type the team does not own?
- If the real dependency misbehaved in the way it usually does in production, which test would notice?
- Would the selectors in this file survive a redesign?

**Now do exercise 02.**

---

## Chapter 3: suites that pass only in order (exercise 03)

### The problem

A test suite is useful only while people believe it. Each red build that turns out to be the suite's fault costs someone an
afternoon, and after a few of them people stop believing red builds, which is how real regressions get merged. The tests at
risk are the ones whose result depends on something other than the code under test.

### Where state lives

A spec file has several lifetimes, and each piece of test state should come from the shortest one that works:

```tree
spec file module scope [one copy for the whole file]
  describe callback [runs once, while tests are collected]
    beforeEach [runs before every test]
    it first test [fresh TestBed injector]
    it second test [fresh TestBed injector]
```

The TestBed resets Angular's injector around every test (chapter 0). It resets nothing else. Here is a leak with no Angular
in it:

```ts
const dune = { id: 1, title: 'Dune', copies: 2 };

it('lends a copy', () => {
  lend(dune);
  expect(dune.copies).toBe(1);
});

it('shows the available copies', async () => {
  const root = await renderShelf([dune]);
  expect(root.textContent).toContain('2 copies'); // 1 if the first test ran before it
});
```

The fixture object is shared and mutable. A factory gives every test its own copy, with only the fields that matter spelled
out:

```ts
const aBook = (overrides: Partial<Book> = {}): Book => ({ id: 1, title: 'Dune', copies: 2, ...overrides });
```

The principle covers everything a test can change and the next test can read: objects at module scope, caches, browser
globals, the clock. Find what the code under test can change, and make sure each test starts from a known state of it.

### Prove independence

Two habits catch order dependence before a colleague does:

- Run each test alone: `npm test -- --watch=false --include='<file>' --filter="<test name>"`.
- Shuffle: `describe.shuffle('Shelf', () => { ... })` runs that block's tests in random order. Shuffling everything
  (`sequence.shuffle`) is a Vitest config option, which under this builder only reaches Vitest through the `runnerConfig`
  file (chapter 0).

Treat "passes only in sequence" as a bug in the suite, the same way you treat a race as a bug in the code.

### Every assertion should be able to say no

For each matcher in a suite, invent a wrong result that still passes it. If you can do it easily, ask whether the test
needed that looseness (a generated id, a float from arithmetic) or only tolerated it because the exact value was not
known. The same goes for waiting: a test that waits on real time is slow on every run and still flaky on a machine slower
than its margin, while fake timers (chapter 0) make the clock an input you control.

### Test what someone outside can observe

A test that reaches into private members, casts to `any` to get at something, or checks the order of internal calls
describes how the code is written today. Rename a field and it breaks although nothing changed for anyone; break the
behaviour while keeping the internals and it still passes. Assert what a user, a caller or the outside world can see:
what is rendered, emitted, sent or stored. For a component, that includes its inputs: give them values through the same
API a parent uses (chapter 0).

### Review questions

- Where does each test get its data, and could an earlier test have changed it?
- Has anyone run each test alone, and the file in a random order?
- If you deleted this test, what bug could ship?
- Would this test still pass after a refactor that keeps the behaviour? Would it fail after one that breaks it?

**Now do exercise 03.**

---

## After the lesson

For each exercise, read `SOLUTION.md` on the `solutions` branch and compare its table of "why this test could not fail"
with your own notes. Then write the PR comment you would leave on the test file, in two or three sentences, naming each
weakness together with what would make the test able to fail.
