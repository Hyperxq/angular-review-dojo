# L2 - Filter widgets: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | Custom dropdown: no `aria-haspopup`/`aria-expanded`/`aria-controls`, no `listbox`/`option` roles, no `aria-selected`, no keyboard handling, options are `div`s that cannot be reached. | **blocking** |
| 2 | Dialog: no `role="dialog"`/`aria-modal`/name, focus is not moved in, not trapped, Escape does nothing, focus is not returned to the opener. | **blocking** |
| 3 | Validation error is a plain `div` inserted later: not announced; the input is not `aria-invalid` and not `aria-describedby` the message. | **blocking** |
| 4 | Reinventing a select: a native `<select>` (or the CDK/Material listbox) would get all of this for free. | should-fix (question the need) |
| 5 | Background content stays reachable by a screen reader's virtual cursor; the modal should make it `inert`. | should-fix |
| 6 | The success message is a live region that is created together with its content: some readers miss it. Keep an empty `role="status"` container in the DOM and fill it. | nit |

## Why

These are patterns from the WAI-ARIA Authoring Practices: the browser exposes only the roles/states you declare, and
the keyboard model is **your** job when you replace a native control.

- **Listbox button:** the trigger carries `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, and while open
  `aria-activedescendant` points at the highlighted option (focus stays on the trigger). Options have `role="option"`,
  `aria-selected`, stable ids.
- **Modal dialog:** `role="dialog" aria-modal="true"` + an accessible name; move focus inside on open (to the safest
  control, here Cancel), wrap Tab/Shift+Tab, close on Escape, and **restore focus** to what opened it. Capture the opener
  before moving focus (some browsers, such as Safari, do not focus a button when clicked, so `document.activeElement` can be
  `body`; in a real app prefer passing the trigger explicitly).
- **Errors:** `role="alert"` is an assertive live region; `aria-invalid` + `aria-describedby` connect field and message.
  The native `<dialog>` element with `showModal()` gives focus management, Escape and inertness for free; jsdom does not
  implement `showModal`, which is why this exercise hand-rolls it.

## The fix (essentials)

```html
<button aria-haspopup="listbox" [attr.aria-expanded]="open()" [attr.aria-controls]="..." [attr.aria-activedescendant]="..." (keydown)="onKeydown($event)">
<div role="listbox"> <div role="option" [attr.aria-selected]="option === value()" [id]="optionId(i)"> ...
<div role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId" (keydown)="onKeydown($event)"> ...
<input [attr.aria-invalid]="error() ? 'true' : null" [attr.aria-describedby]="error() ? 'email-error' : null">
<p id="email-error" role="alert">{{ error() }}</p>
```
```ts
afterRenderEffect(() => { /* when the dialog exists: remember activeElement, focus first control; when it is gone: restore */ });
```

## What the tests can and cannot prove

They assert roles, states, key handling and `document.activeElement` in jsdom, which is a faithful model of the contract.
They cannot judge the spoken output, differences between screen readers, `Space` handling quirks across browsers (the
click for Space fires on keyup in some), or visual focus styling.

## Tradeoffs and discussion

- **Build vs. buy:** Angular CDK (`cdk/a11y`, `cdk/listbox`, `cdk/dialog`) and native elements solve exactly these. Hand-rolling is
  acceptable only with a reason (design constraint) and a test like this one.
- **Focus on trigger + `aria-activedescendant` vs. roving tabindex:** the first keeps typing/trigger focus; the second moves
  real focus into the list. Both are valid; mixing them is the bug.

## What a reviewer should say in the PR comment

> **Blocking:** the sort control is mouse-only: no roles/states, no keyboard. Prefer a native `<select>`; if the custom one
> stays it needs the listbox-button pattern (haspopup/expanded/controls/activedescendant, option roles, arrows/Enter/Escape).
> **Blocking:** the dialog lacks `role="dialog"` + `aria-modal` + name, does not move or trap focus, ignores Escape and
> loses the focus on close. **Blocking:** the validation error is not announced or linked to the field (`role="alert"`,
> `aria-invalid`, `aria-describedby`). *Should-fix:* make the page behind the dialog `inert`.
