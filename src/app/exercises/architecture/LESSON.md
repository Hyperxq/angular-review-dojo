# Feature architecture: a lesson before the exercises

Architecture comments are the hardest ones to write well in a review. A bug comment can point at a line and a failing case.
An architecture comment points at a cost that has not arrived yet. Say too little and the cost arrives. Say too much and you
are the reviewer who blocks every pull request on taste.

This track trains both halves: seeing the structural problem, and deciding how much it should weigh in this pull request.
The exercises go from one component to a whole module.

How to use the lesson:

- Read one chapter, then do its exercise. Each chapter assumes the previous exercise is done.
- The examples come from a library app (books, members, loans, holds, shelves) and each one is a different problem from
  its exercise, on purpose. Recognising the exercise's case is your part.
- Each chapter ends with how to phrase the finding and with review questions to ask while you read the exercise code.

### The forces behind structure

Structure exists to answer a handful of forces. Each one shows up in a recognisable way when the structure does not answer
it:

| Force | How it shows up when ignored | What structure buys |
|-------|------------------------------|---------------------|
| Change cost | A small change touches many files; unrelated changes collide in the same file. | A change stays inside one place. |
| Team boundaries (Conway's law: systems end up shaped like the teams that build them) | Teams wait on each other, merge conflicts between teams, ownership decided in meetings. | Each part has one owner, and the code says who. |
| Testability | A test has to wire up half the app to check one behaviour. | Units small enough to construct with fakes. |
| Onboarding | A new engineer needs days to find where a feature lives. | Names and folders that say what the app does. |
| Extraction | Moving a part to a lazy route or a library turns into archaeology. | Dependencies you can read and follow. |

Structure is overhead until one of these forces is real. A two-person app with five screens can ignore most of this lesson.

### How much a structural finding weighs

| Label | Library example |
|-------|-----------------|
| blocking | Members see wrong data (the opening hours of another branch); something hard to undo (a public URL members have bookmarked changes shape); a contract another team consumes breaks (an export the holds team imports from `loans/index.ts` is renamed). |
| should-fix | A real cost with a clear fix: a new import that reaches into another team's internals, a reusable component that navigates on its own. |
| nit | A file name that does not match the class inside it. |
| question | Taste or an open design choice: "would `fines` be better as its own feature?" |

## Chapter 0: what moved since Angular 17

### Standalone is the default, so the public surface needs a new home

In v17 you still wrote `standalone: true` on every component, and many teams kept NgModules as the unit of a feature. In
22.2.2 `standalone` defaults to `true` (the type definitions say "Set `standalone` to `false` if you want to import the
directive into an NgModule"), and most new code has no NgModule at all.

NgModules never stopped a TypeScript file from importing another. What they gave you was a declared, reviewable list of
what a feature exposed to templates, and a place for the feature's providers. Standalone removes that list, so the
feature's public surface must be declared another way (usually an `index.ts`) and enforced by tooling (chapter 2).
Feature scoping moved to the router: `loadChildren` and `loadComponent` draw the lazy boundary, and a route's `providers`
array scopes services to that part of the app.

### Component contracts are signal inputs and outputs

Signal inputs and outputs make a component's contract readable at a glance:

```ts
export class LoanRow {
  readonly loan = input.required<Loan>();
  readonly compact = input(false);
  readonly renew = output<number>();

  protected readonly label = computed(() => `${this.loan().title} (copy ${this.loan().copyId})`);
}
```

`input()`, `input.required()`, `output()` and `model()` replace `@Input()` and `@Output()` plus `EventEmitter`. A
`computed` over inputs replaces the `ngOnChanges` that recomputed derived fields. With OnPush as the default, a component
whose state is all inputs and computeds renders correctly without any extra work.

### `@Service()`

v22 adds a decorator for services:

```ts
@Service()                          // provided in root automatically
export class Catalogue {}

@Service({ autoProvided: false })   // must be listed in some providers array
export class ShelfEditorState {}
```

`@Service()` does not support constructor injection; use `inject()`. `@Injectable({ providedIn: 'root' })` still works. For
architecture this matters because the scope of a service is a statement about ownership: a root service is shared by the
whole app, while one listed in a feature's route or component `providers` belongs to that feature.

## Chapter 1: who knows what (exercise 01)

### The problem

Three groups of people pay when a component knows too much. Designers want to reuse it on a new page and find it only works
where it was born. Whoever writes its tests pays for every dependency it carries, in setup code that has nothing to do
with what is being tested. And new engineers cannot tell, from reading it, whether it draws things or does things. The force behind all three is the same: the component
mixes how something looks with where things come from and what happens next.

### Containers and presentational components

A container knows where data comes from and what happens on events: it injects services, reads the route, calls APIs,
navigates, records analytics. A presentational component knows how things look: data comes in through inputs, what the user
did goes out through outputs, and it has no I/O of its own.

The library's `BookCover` started like this:

```ts
export class BookCover {
  private readonly flags = inject(FeatureFlags);
  private readonly analytics = inject(Analytics);

  readonly book = input.required<Book>();

  protected readonly showNewBadge = computed(() => this.flags.isOn('new-badge') && this.book().isNew);

  open(): void {
    this.analytics.track('cover_opened', { bookId: this.book().id });
  }
}
```

It looks harmless. Then the self-service kiosk wants the same cover, and the kiosk may not send analytics. Its story needs a
fake `FeatureFlags` and a fake `Analytics` before it renders a picture. The split moves both decisions out:

```ts
export interface CoverView {
  title: string;
  imageUrl: string;
  badge?: 'new' | 'staff-pick';
}

export class BookCover {
  readonly cover = input.required<CoverView>();
  readonly opened = output<void>();
}
```

```tree
routes
  SearchPage [container]
    BookCover [presentational]
  KioskPage [container]
    BookCover [presentational]
```

Each container builds the view model from whatever it is allowed to read, and decides what `opened` means (track it,
ignore it, navigate). The test of the split is mechanical, and you can run it in your head during a review: can this
component be rendered with its inputs alone? The rule of thumb that survives every variant: no HTTP, no navigation and no
analytics in presentational components.

### One place per rule

A business rule is a sentence the product owner could say: "reference books never leave the building", "a suspended
member cannot borrow", "children's cards borrow only from the children's collection". Each rule should exist once, in a
plain function with no Angular in it, with tests for every case it names:

```ts
// circulation-rules.ts
export type BorrowDecision = 'allowed' | 'reference-only' | 'member-suspended' | 'wrong-collection';

export function borrowDecision(member: Member, copy: Copy): BorrowDecision {
  if (copy.kind === 'reference') return 'reference-only';
  if (member.status === 'suspended') return 'member-suspended';
  if (member.card === 'child' && copy.collection !== 'children') return 'wrong-collection';
  return 'allowed';
}
```

The borrow button's `disabled` state, the explanation under it, and the checkout desk's validation all ask
`borrowDecision`. The test file has one case per decision plus the combinations where the order of the checks matters (a
suspended member asking for a reference book).

> [!WARNING]
> Duplicated rules drift: each copy is right the day it is written, and the next change reaches only one of them. For
> every rule you see, find its single owner, then check whether each screen asks that owner or works the answer out again
> on its own.

### When not to split

- A leaf component used once, with one trivial dependency, does not need a container. Splitting it adds a file and buys
  nothing until a second use appears.
- Not every condition is a business rule. "Truncate titles after 40 characters" is presentation and can stay in the
  component.
- A presentational component may read a store, if the store can be provided with a fake in a test. The test that matters is
  "no I/O", not "no providers".

### Saying it in a review

Weigh the finding with the ladder from the introduction. Ask whether a user can already see a wrong result (then it is a
correctness finding, and correctness comes first), or whether the cost is in testing and reuse (usually should-fix). When
splitting a component would add a file and buy nothing, say "fine for now" and move on.

> **Should-fix:** `HoldButton` injects `Router` and navigates to `/holds` after placing a hold. The button is also used on
> the search page, where that navigation is unwanted. Emit a `placed` output and let each page decide where to go.

### Review questions

- Could you render this component in a test with nothing but its inputs and fakes? Which dependency stops you, and does the
  component need it to draw itself?
- For each piece of data on the screen: which single place decides where it comes from?
- For each sentence the product owner could say about this feature: who owns it in code, and does every screen ask that
  owner?

**Now do exercise 01.**

## Chapter 2: boundaries you can test (exercise 02)

### The problem

Two forces meet at a feature boundary. Lazy loading only saves bytes if nothing eager reaches into the lazy part; the people
who pay when it fails are members on slow phones downloading code for screens they never open. And a team can only reshape
its own code if nobody else depends on the inside of it; the people who pay are the owners, whose internals turn into a
contract they never agreed to. The compiler enforces neither, with or without NgModules.

### A feature has a public API

A feature folder holds everything the feature needs, and one file that names what others may use:

```tree
app
  shell [eager]
  features
    admin [lazy]
      index.ts [public]
      admin.routes.ts
      internal
        audit-log.ts [internal]
    loans
      index.ts [public]
      loans-store.ts
```

The shell reaches `admin` only through `loadChildren` and its routes file. Everything the rest of the app needs from a
feature goes through its `index.ts`, so the feature's owners can rename, split or delete anything else freely.

> [!NOTE]
> A barrel makes cycles easier to create and can hide what a file really imports. Keep each one short, with named exports.
> Whether files inside a feature import each other directly is the feature team's call; across features, the barrel is the
> only door.

### Dependencies point one way

Draw the dependencies between features as arrows, imports and injections both. The picture should have layers: lower
layers know nothing about higher ones, and there are no cycles. Cycles come in two kinds, with different symptoms:

| Kind | What happens |
|------|--------------|
| ES module cycle (`a.ts` imports `b.ts` imports `a.ts`) | The module that is evaluated first runs before the other one has; if it reads the other's export at top level, the binding is not initialized yet. For a `class`, `let` or `const` export that is a `ReferenceError` ("Cannot access 'X' before initialization"); with `var` or CommonJS you get `undefined` instead. Which one fails depends on load order. |
| DI cycle (service A injects B, B injects A) | `NG0200`, a circular dependency in DI, when Angular resolves the `inject()` calls. It needs the cycle in construction, not merely in imports. |

The library has a DI cycle waiting to happen:

```flow
HoldsService -> LoansService: asks whether a copy is on loan
LoansService -> HoldsService: notifies the next hold when a copy returns
```

There are four ways out, and the right one depends on what the arrows mean:

| Move | When it fits | What it costs |
|------|--------------|---------------|
| Move the shared piece down | Both sides use something that belongs to neither (a type, a constant, a date helper). | A new file or a new lower feature. |
| Invert with an event | One side only needs to announce that something happened. | Control flow becomes implicit: you cannot read "who reacts" from the announcing code, and the order of reactions is harder to reason about. |
| Invert with a port | One side needs a capability, not a particular implementation. It declares an `InjectionToken` or an abstract class; the other side provides it (the hexagonal architecture answer). | One more abstraction, and the wiring lives in providers instead of imports. |
| Merge | The two "features" change together for the same people. They are one feature. | A bigger folder, which is fine if it has one owner. |

Here, loans do not need to know that holds exist; they need to announce that a copy came back. If `LoansService` exposes
that as an observable or a signal and `HoldsService` listens, the arrow from loans to holds disappears:

```flow
HoldsService -> LoansService: asks about loans and listens for returned copies
```

### Fitness functions

A convention that lives only in people's heads is enforced by whoever happens to review the PR. A convention written as a
test is enforced on every run. An architectural
fitness function is a cheap automated check that fails when the structure breaks a rule:

```ts
it('the shell imports admin only through its routes file', () => {
  const files = sourceFilesUnder('src/app/shell');
  expect(files.length).toBeGreaterThan(0); // the check must see code, or it proves nothing
  for (const file of files) {
    const adminImports = importsOf(file).filter((path) => path.includes('/features/admin/'));
    expect(adminImports.every((path) => path.endsWith('admin.routes'))).toBe(true);
  }
});
```

The `toBeGreaterThan(0)` line matters more than it looks: a check that silently finds no files is green forever. For a
whole repository, use a ready-made tool: boundary rules for ESLint, Nx's module boundary lint rule, `dependency-cruiser`,
or `madge` to list cycles.

### When not to use them

- A small app with one team and a handful of folders does not need barrels or boundary tests yet. Add them when a second
  team or a lazy boundary appears.
- Do not encode a rule nobody has agreed on. A fitness function turns an opinion into a red build; agree first, then automate.
- Do not invert every dependency "for decoupling". Each inversion hides a call; use it where the arrow really points the
  wrong way.

### Saying it in a review

Boundary problems are cheap to fix in the PR that introduces them and expensive once other code depends on them, so they
weigh more than their line count suggests. Ask two things: is the problem new in this PR, and how far does it spread (one
file, one feature, or everything that imports it)? When the rule is not written down anywhere, the most useful comment also
asks for the automated check:

> **Should-fix:** `features/members/index.ts` does `export * from './internal/member-directory'` and two other internal
> files, so the public API is now every export in the folder. Please export only `MemberDirectory` and the `Member` type.
> Could we add a fitness test so the barrel stays small?

### Review questions

- For each new import or injection across folders: which feature owns the target, and did the owner choose to make it public?
- Draw the arrows this PR adds. Does any arrow point up a layer, or close a loop? If it closes a loop, which of the four
  moves matches what the arrows mean?
- Which rule protects this boundary today: a test, a lint rule, or someone's memory? Would the check fail if it found no files?

**Now do exercise 02.**

## Chapter 3: changing structure without changing behaviour (exercise 03)

### The problem

The cost of an overgrown class or folder is paid by people who never chose it. Reviewing a small change in it means
understanding a lot of unrelated code. The owner of one corner cannot change it without asking the owners of the others.
Every change carries a risk nobody can size in advance, so changes get postponed. In the library app, `LegacyCatalogClient` is that kind of code:
every feature calls it for anything about books, and replacing it keeps getting postponed.

### Reasons to change

The single responsibility principle is easiest to apply in its original wording: a module should have one reason to change,
meaning one group of people who ask for its changes. Two related ideas make it measurable in a review:

- Cohesion: the parts of a module change together and for the same people.
- Coupling: how much a module has to know about others to do its job. High coupling means a change in one place forces
  changes elsewhere.

### Finding where to cut

Three cheap ways to find the seams:

- Ask who requests changes to each part. Code that changes for different people belongs in different places.
- Look at history. Files that always change together belong together; a file that changes with everything is doing too much.

  ```sh
  git log --since=6.months --name-only --format= -- src/app | rg -v '^$' | sort | uniq -c | sort -rn | head
  ```

- Look at state. Whoever writes a piece of state owns it; code that writes state owned somewhere else is coupled to it,
  whatever the names say.

Then draw the arrows between the pieces you found (chapter 2), and for each piece ask what it would drag along if you moved
it today.

### Folders by kind, folders by feature

A top level of `services`, `components`, `models` and `utils` tells a new engineer what kinds of files Angular has, which
they already know. It does not tell them where anything the app does lives, and it draws no boundary: any file may import
any other, because they are all in the same app-wide bins. A top level named after what the app does ("screaming
architecture": the structure shouts the domain) tells them where to look, and makes every cross-feature import visible in
its path.

Folders by kind are fine in a small app with one team, where everyone knows where everything is. Whatever the layout, a
`shared` folder must know no feature: once it imports one, every feature that uses `shared` carries that feature along.

### Refactoring without changing behaviour

A structural change is only safe when behaviour is pinned first, by characterization tests: tests that record what callers
see today, right or wrong.

The strangler fig pattern replaces old code gradually. New code grows beside the old, callers move over one by one, and the
old code is removed when nothing calls it. It has real tradeoffs you should look for in a review:

- For a while there are two code paths for the same job, and a bug fix may be needed in both.
- Something often sits in front of the old code to route calls (a facade or an adapter). Decide how long it may live; a
  facade without an end date becomes the next legacy layer.
- The old behaviour may be wrong. Characterization tests pin bugs too, so decide on purpose whether the migration keeps a
  bug (and fixes it after) or fixes it during (and accepts that the tests change).

Working out the order of the steps for a given codebase is part of the exercise.

### Why write the decision down

An architecture decision record (ADR) is a short document in the repo that records a decision and, as importantly, the
options that lost. Rejected alternatives are what stop the next person from reopening the same debate, and they say when
the decision should be revisited: if the reason an option lost stops being true, the decision is open again.

> [!TIP]
> Most decomposition questions have more than one defensible answer. A review of a restructuring is less about finding the
> one right tree than about whether the author chose on purpose, wrote down what they rejected, and can enforce the result.

### When not to do it

- Not without characterization tests. A refactor you cannot prove behaviour-preserving is a rewrite with extra risk.
- Not in one big change. A restructuring that moves everything at once cannot be reviewed.
- Not because a file is long. Length is a smoke alarm; the reason to split is several reasons to change.

### Saying it in a review

Severity depends on what the PR does to the cost: does it create the cost, make an existing one worse, or merely sit next to
it? A PR that creates a new tangle earns a should-fix or worse. A PR that adds a little to an existing one deserves a
comment and a ticket. A PR that only sits next to an old problem gets a question or a nit at most, because asking a small PR
to fix what it did not cause is scope creep.

> **Question:** this PR adds a third date formatter to `shared/dates.ts`, next to two that look similar. Is there a reason
> they differ? If not, I'm happy to leave the merge for a cleanup ticket.

### Review questions

- Who asks for changes to each part of this code? Do parts that change for different people live apart?
- What would you have to bring along if you extracted this piece tomorrow?
- What proves that users see the same thing after the change?
- Is the decision written down with what it rejected, and is the new structure checked by something that runs in CI?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch. In this track, pay most attention to the
tradeoffs section and, for the third exercise, the ADR: compare its alternatives with the ones you thought of. Then write
the PR comment you would leave, and check that it says what it costs if nobody fixes it.
