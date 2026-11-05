# Forms: a lesson before the exercises

You built a lot of forms in Angular 17. You know `FormGroup`, `formControlName`, `Validators.required`, and the little dance
of showing an error only after the user has left the field. Most of that still works and still matters. Two things changed
around it: reactive forms grew a few new tools, and Angular 22 ships a second forms system, Signal Forms, as stable API. The
exercises cover both. The first two use reactive forms, the third uses Signal Forms.

Every form serves three parties, and each review question in this lesson comes back to one of them:

- The person filling it in must not lose their input, must know what is wrong and when, and must not submit twice.
- The business must receive a complete, valid payload.
- The server must not be flooded with checks nobody needed.

Two of those needs have tools you should know before the chapters. Losing input usually happens on navigation: a librarian
half-way through a loan form clicks another menu item. `form.dirty` tells you the user changed something, and a `CanDeactivate`
route guard can ask before leaving. If you offer a "start over" button, `reset()` on a form built with `NonNullableFormBuilder`
goes back to the initial values instead of `null`. Double submits are the other need. Signal Forms has `submitting()` and
refuses a second `submit()` while the first runs (it returns `false`). Reactive forms have nothing built in, so you track it
yourself.

How to use this lesson:

- Read one chapter, then do its exercise. Each chapter assumes you finished the previous exercise.
- The examples live in a library (books, members, loans, shelves). The exercises live somewhere else on purpose. You get the
  rules here and decide where they apply there.
- Each chapter ends with review questions. Ask them while you read the exercise code. Most form bugs are visible in the class
  without running anything, if you ask the right question about each line.

## Chapter 0: what moved since Angular 17

### Typed forms are the normal case

Typed reactive forms arrived in v14, so you have seen them, but a lot of v17 code still used `UntypedFormGroup` while it
migrated. In the installed version `UntypedFormGroup` is literally `FormGroup<any>`. It exists for migration. When you see it in
new code, the compiler has been switched off for that form: `form.value` is `any`, and anything you emit from it type-checks.

The usual way to build a typed form is `NonNullableFormBuilder`:

```ts
private readonly fb = inject(NonNullableFormBuilder);

readonly loan = this.fb.group({
  memberId: ['', Validators.required],
  days: [14, [Validators.min(1), Validators.max(28)]],
});
// loan.controls.days is FormControl<number>, not FormControl<number | null>
// loan.reset() goes back to '' and 14, not to null
```

### One event stream per control

Every `AbstractControl` now has an `events` observable that carries all state changes as typed events: `ValueChangeEvent`,
`StatusChangeEvent`, `TouchedChangeEvent`, `PristineChangeEvent`, and on the root form `FormSubmittedEvent` and
`FormResetEvent`. You no longer need to combine `valueChanges` and `statusChanges` and guess about touched state:

```ts
this.loan.events
  .pipe(filter((event) => event instanceof FormSubmittedEvent), takeUntilDestroyed())
  .subscribe(() => this.audit.log('loan form submitted'));
```

Two smaller additions you will meet: `markAllAsDirty()` sits next to the old `markAllAsTouched()`, and a top-level
`FormArray` can be bound directly with `[formArray]`.

### Signal Forms

`@angular/forms/signals` is a different model. You own the data in a writable signal, and `form()` builds a tree of fields
around it. In the installed 22.2.2 the API is marked `@publicApi 22.0`, which means stable. The experimental pieces are the
WebMCP integration: `provideExperimentalWebMcpForms` and the `experimentalWebMcpTool` form option. You can ignore both.

| | Reactive forms | Signal Forms |
|---|---|---|
| Where the data lives | Inside the controls (`control.value`) | In your signal; the form writes to it |
| How you declare rules | Validator functions passed to each control | A schema function that registers rules on paths |
| How you read state | Properties (`valid`, `touched`) and observables | Signals (`valid()`, `touched()`) |
| Template binding | `formControlName`, `[formGroup]` | `[formField]`, `[formRoot]` |
| Custom controls | `ControlValueAccessor` | A component with a `value = model()` |

Migration does not have to be all at once. `[formField]` still binds to a component that provides `NG_VALUE_ACCESSOR`, as a
backwards-compatible path, so component libraries built on value accessors (Angular Material among them) keep working.
`@angular/forms/signals/compat` exports `compatForm` and `SignalFormControl` for mixing the two models while you move a form
over. Template-driven forms (`ngModel`) still exist as well.

### When to choose which

- Reactive forms: existing code, and forms that lean on a deep ecosystem of value-accessor components.
- Signal Forms: new forms that start from a data model, especially with rules that read several fields.
- Template-driven forms: trivial forms with one or two fields and no cross-field rules.

Do not rewrite a working reactive form only to use signals. Chapter 3 covers Signal Forms in detail. Existing codebases are full
of reactive forms, and you will review both kinds for years.

## Chapter 1: what a form group contains, and what it reports (exercise 01)

### The problem

A librarian renews a member's card at the desk with a queue behind them. They trust the form to pass on what they entered,
and the server trusts the form to pass on only valid data. When either trust is misplaced, the error shows up days later in a
member's record, far from the screen that caused it, and nobody remembers what was typed. To reason about that, you need to
know what a form group reports and when.

### `value` is a filtered view

A form group answers two different questions with two different accessors:

| Accessor | Includes | Typed as |
|---|---|---|
| `group.value` | Only enabled controls | A partial object: every key optional |
| `group.getRawValue()` | Every control, enabled or disabled | The full object |

Disabling a control is one way reactive forms say "show this, but do not let the user change it". A disabled control also drops
out of `value`, and out of validation:

```ts
readonly renewal = this.fb.group({
  cardNumber: [{ value: 'LIB-0042', disabled: true }],
  years: [1, Validators.min(1)],
});

this.renewal.value;         // { years: 1 }
this.renewal.getRawValue(); // { cardNumber: 'LIB-0042', years: 1 }
```

With typed forms the compiler sees this. `renewal.value` is typed `{ cardNumber?: string; years?: number }`, so assigning it to a
type with required fields fails to compile. With an untyped form it compiles and fails at runtime, in the backend, in someone
else's log.

### Disabled or read-only is a business decision

Before choosing an accessor, ask whether the value belongs in the submission at all. If the server already knows the card number
(it is in the URL, or in the session), sending it back adds nothing and invites tampering. If it does belong, choose how to show
it:

| | `disabled` control | `<input [readonly]="true">` |
|---|---|---|
| In `value` | No | Yes |
| Validated | No | Yes |
| Tab order | Removed | Kept |
| Assistive technology | Announced as unavailable | Focusable and readable |

### Each validator checks one kind of value

The built-in validators look interchangeable, but each one checks a single kind of value:

| Validator | Checks | Note |
|---|---|---|
| `required` | Empty value (`null`, `undefined`, `''`, an empty array or `Set`) | The only one that fails on empty |
| `min(n)` / `max(n)` | The value parsed as a number | Text that does not parse as a number passes |
| `minLength(n)` / `maxLength(n)` | `.length` of a string or array (or `.size`) | An empty value passes; pair it with `required` |
| `pattern(re)` | A string against a regular expression | |
| `email` | A plausible email address | |

The second column is the one to check in a review. A validator applied to the wrong kind of value returns `null`, which means
"valid", and nobody gets an error.

### When an error becomes visible

Every control tracks interaction state next to its validity:

| State | Becomes true when |
|---|---|
| `dirty` | The user changed the value |
| `touched` | The user focused the control and left it (blur) |
| `pristine` / `untouched` | The opposites, the initial state |

The common rule "show an error only once the field is touched" is a good one. It keeps an empty form from opening in red. It
also has a gap: a field the user never visited is never touched, so its error stays hidden however many times they press a
button. Reactive forms have an API for "treat everything as visited": `markAllAsTouched()`. A loan desk might call it in a
"Review before lending" step, so the librarian sees every problem on one screen before the loan goes out:

```ts
protected review() {
  this.loan.markAllAsTouched();
  this.step.set('review');
}
```

`ngSubmit` on a `<form [formGroup]>` is the form directive's own event. It fires on the native submit and sets the directive's
`submitted` flag, which you can read if you prefer "after the first submit" as the rule for showing errors.

```tree
renewal [FormGroup, INVALID]
  cardNumber [disabled, left out of value]
  years [touched: false, errors: min]
```

### Review questions

- What does the compiler know about the object this form emits? Is it typed, or is it `any`?
- Compare what the user sees with what the backend receives. Are they the same set of fields? Should they be?
- For each validator: what kind of value does it check, and what kind of value does this control hold?
- If the user submits without touching anything, which errors appear?

**Now do exercise 01.**

## Chapter 2: custom controls, async validators, and rules across controls (exercise 02)

### The problem

At the returns desk a librarian scans 30 ISBNs a minute. Each check that the book exists and is not marked lost costs a call to
the catalog service, and a loan must never go out for a lost book. The form needs a custom control or two, a check that talks
to the server, and rules that span several fields.

### The `ControlValueAccessor` contract has two directions

A custom form control is a component that registers itself as `NG_VALUE_ACCESSOR`. The form directive then talks to it through
four methods. Draw them as arrows and you see that the conversation goes both ways:

```flow
FormControl -> Accessor: writeValue(value), model to view
Accessor -> FormControl: onChange(value), view to model
Accessor -> FormControl: onTouched(), the user left the control
FormControl -> Accessor: setDisabledState(isDisabled)
```

`writeValue` is the form telling your component what to show. `registerOnChange(fn)` and `registerOnTouched(fn)` hand you
functions; you store them and call them when the user changes the value or leaves the control. `setDisabledState` is optional
in the interface, which is exactly why it gets forgotten: without it, `control.disable()` has no effect on your component.

Here is a star rating for book reviews, written against the full contract:

```ts
@Component({
  selector: 'app-star-rating',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRating), multi: true }],
  template: `
    @for (star of stars; track star) {
      <button type="button" [disabled]="disabled()" (click)="rate(star)" (blur)="onTouched()">
        {{ star <= rating() ? '★' : '☆' }}
      </button>
    }
  `,
})
export class StarRating implements ControlValueAccessor {
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly rating = signal(0);
  protected readonly disabled = signal(false);
  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: number) { this.rating.set(value); }
  registerOnChange(fn: (value: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled.set(isDisabled); }

  protected rate(star: number) {
    this.rating.set(star);
    this.onChange(star);
  }
}
```

Look at `rate`: it updates what the component shows and tells the form. Updating only the first leaves the screen and the model
disagreeing, and nothing warns you.

### An async validator runs on every value

An async validator is a function from a control to an observable of errors. Angular calls it whenever the value changes (after
the sync validators pass). If a new value arrives while the previous check is still running, Angular unsubscribes from the
previous observable. Here is an "ISBN exists in the catalog" check while a librarian types:

```marbles
isbn:      a--b--c-------------
check(a):  ---x                   // unsubscribed when b arrives
check(b):     ---x                // unsubscribed when c arrives
check(c):        ------r|
```

Unsubscribing is cleanup on the client. It cannot recall a request that was already sent, so the server still did the work for
`a` and `b`.

The observable must also complete. Angular combines a control's async validators with `forkJoin`, which emits only when every
source completes, so a validator built on a stream that never completes (`valueChanges`, a store selector) leaves the control
`PENDING` forever.

### When is a check worth paying for?

That is the design question behind every async validator. Often the answer is "when the librarian leaves the field", and
reactive forms support it without any RxJS:

```ts
isbn: this.fb.control('', {
  validators: [Validators.required],
  asyncValidators: [isbnInCatalog(this.catalog)],
  updateOn: 'blur',
}),
```

With `updateOn: 'blur'` the value, and every validator, update when the control loses focus. The tradeoff is feedback that
arrives later, in exchange for far fewer calls. `updateOn: 'submit'` pushes it further, to the moment of submitting.

### `PENDING` is a third state

While an async validator runs, the control status is `PENDING`. The four statuses are `VALID`, `INVALID`, `PENDING` and
`DISABLED`, and the boolean getters each test one of them:

```marbles
status:    v--p------i-------    // v = VALID, p = PENDING, i = INVALID
valid:     t--f------f-------    // t = true, f = false
invalid:   f--f------t-------
pending:   f--t------f-------
```

During the pending window `valid` and `invalid` are both false. A guard before submitting has to pick one of these getters, and
the two choices behave differently for a form that is still checking. Which getter does your guard test, and is that the rule
you mean?

### A rule about several controls lives on their parent

A validator sees only the control it is attached to. A rule that involves two dates, or every line in a list, cannot be
expressed on any one of them. Put it on the group or array that contains them all, and type it so the compiler checks the shape:

```ts
const returnAfterPickup: ValidatorFn = (control) => {
  const { pickup, due } = (control as AbstractControl<{ pickup: Date; due: Date }>).getRawValue();
  return due > pickup ? null : { dueBeforePickup: true };
};

readonly loan = this.fb.group({
  dates: this.fb.group({ pickup: [today()], due: [inTwoWeeks()] }, { validators: returnAfterPickup }),
  books: this.fb.array([this.newBook()]),
});
```

The error then lives on `dates`, so the template reads `loan.controls.dates.hasError('dueBeforePickup')`. A group-level error
does not turn the `due` input red on its own, so place the message deliberately, next to the field the user should change. The
same move works for a `FormArray`: `this.fb.array([...], someValidatorFn)` sees all the items at once.

```tree
loan [FormGroup]
  dates [FormGroup, validator: returnAfterPickup]
    pickup [FormControl]
    due [FormControl]
  books [FormArray, a rule across items goes here]
    0 [FormGroup]
      isbn [FormControl, async validator]
      rating [StarRating via ControlValueAccessor]
```

### Review questions

- For each `ControlValueAccessor` method: is it implemented, and does anything ever call the functions it receives?
- When the form disables this control, what does the user see? When the user leaves it, does the form know?
- How many requests does typing one value cause? When does each one start?
- What does the submit guard do with a form whose status is `PENDING`?
- Is each rule attached to the control that can see all the values the rule talks about?

**Now do exercise 02.**

## Chapter 3: Signal Forms (exercise 03)

### The problem

A member signs up online. Children under 16 need a guardian's name, family plans are not offered to children, and the rules
change as the member types their age. Rules that depend on other fields and change while the user types are where Signal Forms
does best, and where a few of its rules are easy to get wrong.

### The model is yours

In Signal Forms you start from data, not from controls:

```ts
interface Membership {
  name: string;
  age: number;
  guardian: string;
  plan: 'single' | 'family';
}

protected readonly model = signal<Membership>({ name: '', age: 18, guardian: '', plan: 'single' });
protected readonly signup = form(this.model, (path) => {
  required(path.name, { message: 'Name is required' });
  min(path.age, 5, { message: 'Members are at least 5 years old' });
});
```

`form()` does not copy the data. Typing in a field writes to `model`, and setting `model` updates the fields. `signup` is a
`FieldTree`: it has the same shape as `Membership` (`signup.name`, `signup.age`), and calling any node gives you its
`FieldState`, which is a bag of signals:

| Signal | Meaning |
|---|---|
| `value()` | The field's value (writable) |
| `errors()` / `errorSummary()` | Errors of this field / of this field and its children |
| `valid()` / `invalid()` / `pending()` | Same three-state logic as `PENDING` in chapter 2: `valid()` is not `!invalid()` |
| `touched()` / `dirty()` | Interaction state, as in reactive forms |
| `disabled()` / `readonly()` / `hidden()` / `required()` | Results of the rules registered in the schema |
| `submitting()` | A submission is running |

The template binds a field with the `FormField` directive:

```html
<label>Name <input [formField]="signup.name" /></label>
@for (error of signup.name().errors(); track error.kind) {
  <p role="alert">{{ error.message }}</p>
}
```

This snippet shows too much, too early. `errors()` holds the current errors from the moment the form exists, whether or not
anyone has looked at the field, so deciding when a message is worth showing is your job. Chapter 1 answered that question for
reactive forms, and the field state has the same signals. `role="alert"` on every message also makes a screen reader interrupt
while the user is still typing. For messages next to a field, link them with `aria-describedby` and mark the input with
`aria-invalid`; keep `role="alert"` for a summary shown after submitting.

### The schema runs once; the logic inside it re-runs

The whole API rests on this rule. The schema function `(path) => { ... }` runs once, when `form()` is created. It receives
paths, not values, and its job is to register rules on those paths. The functions you pass to the rules are different: they
receive a field context and run reactively, again whenever a signal they read changes.

```flow
form(model, schema) -> schema function: runs once, at creation
schema function -> rules on paths: registers
rules on paths -> logic functions: keep
model signal -> logic functions: re-run them when what they read changes
```

So anything you read in the schema body is a snapshot of that first moment. Anything you read inside a logic function through
its context stays current. The context gives you:

- `value()`: the current field's value, as a signal;
- `valueOf(path.other)`: the current value of another field;
- `stateOf(path.other)`: another field's whole state (`touched()`, `valid()` and so on).

Here is the difference on a rule that compares two fields, the due date of a loan and a limit that depends on the plan:

```ts
form(this.loanModel, (path) => {
  const limit = this.loanModel().plan === 'family' ? 28 : 14; // read once, never again

  validate(path.days, ({ value, valueOf }) => {
    const max = valueOf(path.plan) === 'family' ? 28 : 14;    // read on every run
    return value() <= max ? null : { kind: 'tooLong', message: `At most ${max} days` };
  });
});
```

The first line looks harmless and it type-checks. It also freezes the plan the member had when the page opened. A validator
returns `null` (or `undefined`) for success and one error or a list of errors otherwise; every error needs a `kind`.

### Conditional rules

Most built-in rules accept a condition, and a few rules exist only to express conditions:

```ts
form(this.model, (path) => {
  required(path.guardian, {
    message: 'Young members need a guardian',
    when: ({ valueOf }) => valueOf(path.age) < 16,
  });
  hidden(path.guardian, ({ valueOf }) => valueOf(path.age) >= 16);
  disabled(path.plan, ({ valueOf }) => valueOf(path.age) < 16);
});
```

> [!IMPORTANT]
> `hidden` changes state, not the DOM. A hidden field is ignored when Angular computes `valid`, `touched` and `dirty` for the
> form, but the template still renders it until you wrap it in `@if`. Rendering is always your decision.

For a group of rules that all share one condition, `applyWhen(path, condition, schema)` applies a whole sub-schema
conditionally. `validateAsync` and `validateHttp` are the async counterparts of `validate`. `debounce(path, ms)` delays how
quickly UI changes reach the model, and `debounce(path, 'blur')` waits until the user leaves the field, the counterpart of
`updateOn: 'blur'` from chapter 2.

### Submitting through the form

A plain `(submit)="save($event)"` handler on the `<form>` is just a DOM event handler. It runs whether the form is valid or not,
unless you check. Signal Forms has a submission flow that does the checking for you:

```ts
protected readonly signup = form(
  this.model,
  (path) => { /* rules */ },
  {
    submission: {
      action: async (field) => {
        await this.members.register(field().value());
        return undefined; // or errors to attach to fields, for example a "card already exists" from the server
      },
      onInvalid: (field) => field().errorSummary()[0]?.fieldTree().focusBoundControl(),
    },
  },
);
```

```html
<form [formRoot]="signup">
  ...
  <button type="submit">Join the library</button>
</form>
```

The `formRoot` directive calls `preventDefault()` on the native submit and runs `submit(signup)`. You can also call
`submit(form, action)` yourself. Either way, `submit`:

1. marks every field as touched,
2. checks validity and runs the action only if the check passes, or calls `onInvalid` if it does not,
3. sets `submitting()` while the action runs and refuses a second submit until it ends,
4. attaches any errors the action returns to the fields they name.

> [!WARNING]
> `formRoot` always calls `preventDefault()`, but it calls `submit()` only when the form was created with `submission` options.
> A `<form [formRoot]>` without them swallows the submit silently: no error, no request.

> [!WARNING]
> The default check is "not invalid" (`ignoreValidators: 'pending'`), so pending async validators do not block the action. It
> is the same three-state trap as in chapter 2. Set `ignoreValidators: 'none'` when the action must wait for every check to
> pass, either in the `submission` options of `form()` (which is where `formRoot` reads it) or in the options you pass to
> `submit()`.

### Custom controls without a value accessor

You will not need it for exercise 03, but it closes the loop with chapter 2: a custom control for Signal Forms is a component
with `readonly value = model<T>()`, which implements `FormValueControl<T>`. It can also declare optional inputs such as
`disabled`, `touched` or `errors`, which the `[formField]` directive fills in, and it emits a `touch` output on blur, which is
the Signal Forms counterpart of `onTouched`. There is no registration and no callbacks to store.

### Review questions

- Which lines in the schema body run once, and do any of them read a value that can change later?
- Does each cross-field rule read the other field through its context, or from a variable captured outside it?
- For each error message: under what state does it first appear? What does the user see on a form they have not touched?
- For each conditional field: is the rule conditional, and is the rendering conditional, and do both use the same condition?
- What runs when the user presses submit? Does anything check validity before the data leaves the component?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write, in two
sentences, the comment you would leave on the pull request. If you cannot write it without looking, reread the chapter.
