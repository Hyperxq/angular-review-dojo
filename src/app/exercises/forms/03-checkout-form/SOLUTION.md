# L3 - Checkout form (Signal Forms): solution

## What was wrong

1. **Errors rendered unconditionally.** `field().errors()` is populated from the first moment, so a
   pristine form is covered in red. Each field state also exposes `touched()` and `dirty()`;
   show messages only after the customer has visited the field. `submit()` marks every field as touched,
   so pressing "Place order" reveals the rest.
2. **`const accountEmail = this.model().email` in the schema callback.** The callback passed to
   `form(model, (path) => ...)` runs **once**, at creation, so that value is a snapshot of the
   prefilled address. Anything that must follow the model has to be read inside the validator through its
   context: `({ value, valueOf }) => value() === valueOf(path.email)`.
3. **`required(path.giftNote)` was unconditional, and the textarea always rendered.**
   `required` accepts `when: ({ valueOf }) => ...`; the textarea is rendered only for gifts.
4. **The component's own `(submit)` handler called the API directly.** Nothing checked
   validity. The Signal Forms way is `submit(form, action)`, or the `formRoot` directive on the
   `<form>` plus `submission.action` in the form options: the action runs only when the form is
   not invalid, it marks all fields touched first, and the directive calls `preventDefault()` on the native
   submit. (By default the check is `!invalid`, so a form with async validators still pending would run the
   action; pass `ignoreValidators: 'none'` to `submit()` to require `valid`. It is the same trap as
   `PENDING` in the reactive-forms L2 exercise.) `submit()` also refuses re-entry while the previous submission is running.

## The fix

```ts
protected readonly checkout = form(
  this.model,
  (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email' });
    validate(path.confirmEmail, ({ value, valueOf }) =>
      value() === valueOf(path.email) ? null : { kind: 'mismatch', message: 'Emails do not match' });
    min(path.quantity, 1, { message: 'Order at least one unit' });
    required(path.giftNote, { message: 'Write a gift note', when: ({ valueOf }) => valueOf(path.wantsGift) });
  },
  { submission: { action: async () => { ... } } },
);
```
```html
<form [formRoot]="checkout"> ... @if (checkout.email().touched()) { ... } ... </form>
```

## Signal Forms facts (verified in the installed @angular/forms 22.2.2 types and source)

- Import from `@angular/forms/signals`. Every export is tagged `@publicApi 22.0` (not experimental);
  only a few extras such as `provideExperimentalWebMcpForms` are marked experimental.
- The model is a `WritableSignal`; `form(model, schema?, options?)` returns a `FieldTree` that mirrors its
  shape. `checkout.email()` returns the field state with signals: `value`, `errors`, `touched`,
  `dirty`, `valid`, `invalid`, `disabled`, `hidden`, `readonly`, `required`...
- The binding directive is `[formField]` (selector `[formField]`, input alias `formField`) and the form-level
  directive is `form[formRoot]`. Older write-ups call these `[field]` / `[control]`; do not rely on them.
- Built-in rules are functions you call on a path inside the schema: `required`, `email`, `min`,
  `max`, `minLength`, `maxLength`, `pattern`, `validate`, `validateAsync`, `validateHttp`,
  `validateTree`, plus `disabled`, `hidden`, `readonly`, `debounce`, and `applyWhen`/`applyEach` for conditional and
  array schemas. A custom error is an object with a `kind` (and usually a `message`).
- Because the data is a plain signal model, there is no `getRawValue`/disabled-control pitfall: the
  model always holds every field.

## Modern Angular takeaway

- With Signal Forms the model is the source of truth, validation is declared once in a schema, and
  cross-field rules read other fields through the validator context (`valueOf(path.x)`), not through captured
  values.
- Let the framework own submission (`submit` / `formRoot`); hand-written submit handlers skip validation.

## What a reviewer should say in the PR comment

> The schema callback runs only once, so `accountEmail` is a stale snapshot; read the other field with
> `valueOf(path.email)` inside the validator. Show errors only for touched fields, make the gift note
> conditional (`when`), and submit through `formRoot`/`submit()`, because the handler as written sends
> invalid orders to the API.
