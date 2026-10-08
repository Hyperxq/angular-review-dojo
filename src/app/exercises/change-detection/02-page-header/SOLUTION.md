# L2 - Page header: solution

## What was wrong

Angular checks a parent's template, then its children, then runs the children's `ngAfterViewInit`. In dev mode a second
pass (`checkNoChanges`) re-evaluates every binding of the views it covers and throws
`ExpressionChangedAfterItHasBeenCheckedError` (NG0100) if a value is different from the one just rendered.

1. **`ProductsPage` wrote a plain field of a shared service in `ngAfterViewInit`.** The layout's `<h1>` had been
   rendered with `''` before that hook ran; the second pass saw `'Products'` and threw. In production there is no
   second pass: the header simply stayed empty until some other event refreshed the layout.
2. **The `setTimeout` + `markForCheck()` "fix" in `OrdersPage`.** It removes the error by moving the write to a
   later task, so the first render is always wrong and a second render is always needed (flicker, flaky tests that read the
   heading right after navigation). `markForCheck()` is also the work a signal does for you.
3. **A getter with side effects** (`get fieldId() { return \`feedback-${++seq}\`; }`). A template calls the getter once
   per binding, per evaluation: the label and the text area got different ids, and the second dev pass saw a new value.
   Values used by a template must be stable between two evaluations.

## The fix

```ts
// PageTitle: state the layout reads is a signal
readonly title = signal('');
// header: {{ pageTitle.title() }}
// pages: publish the title before the first check of the layout
constructor() { inject(PageTitle).title.set('Products'); }
```
```ts
let nextId = 0;
protected readonly fieldId = `feedback-${nextId++}`;   // computed once per instance
```

`changeDetection: ChangeDetectionStrategy.Default` markers are removed too: `Default` is a deprecated alias of `Eager`
in Angular 22 and nothing here needs it.

## Facts worth knowing (verified in the installed source)

- The second pass is `ApplicationRef.tickImpl` calling `view.checkNoChanges()` for every view, in dev mode only.
- It only covers views that would be checked. In this repo's TestBed the error appears when the host and the layout are
  `Eager` (what ported `Default` components are). With `OnPush`, the default in Angular 22, a clean view is not checked
  in the second pass, so the same bug is a **silent stale header** instead of an exception. A green dev console does not
  prove the data flow is right.
- A signal read in a template is tracked: when it changes the view is marked for refresh and the application loops
  again (up to 10 rounds) before the dev-mode pass, so the header is updated in the same tick.
- Where a title really belongs: the router. `{ path: 'orders', title: 'Orders', ... }` with a `TitleStrategy` (see the
  Routing L5 exercise) needs no shared mutable service at all.

## Modern Angular takeaway

- Data flows down during change detection. A child that must influence an ancestor does it through a signal (or an
  output/event), not by assigning to a field the ancestor already rendered.
- `setTimeout` is never the fix for NG0100. If `afterNextRender` is needed it is for **reading the DOM**.
- No side effects in getters or template method calls.

## What a reviewer should say in the PR comment

> `ngAfterViewInit` writes a plain field that the layout rendered earlier in the same pass (NG0100 in dev, a stale header in
> prod), and the Orders page "fixes" it with `setTimeout` + `markForCheck`, which makes the first render wrong. Keep the
> title in a signal and set it before the layout is checked. The `fieldId` getter generates a new id on every evaluation;
> compute it once.
