# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

The stepper is a custom form control. Read the `ControlValueAccessor` contract again: there are
two directions (model to view, view to model) and two extra signals (touched, disabled). Which of
the four are implemented?

</details>

<details><summary>Hint 2 - area</summary>

- `registerOnChange` hands you a function. Who calls it?
- While an async validator is running, the control status is `PENDING`. Is a `PENDING` form
  `invalid`? Is it `valid`?
- The async validator receives every new value. What operator turns "after the user stops typing for a while"
  into code? (Angular cancels the previous async validation when the value changes.)
- A rule that involves several lines belongs on the control that contains all of them.

</details>

<details><summary>Hint 3 - near the answer</summary>

Call `onChange(newValue)` in `step()`, store and call `onTouched` (for example on `blur`), implement
`setDisabledState` with a signal bound to `[disabled]`. In the validator: `timer(300).pipe(switchMap(() => api.isAvailable(...)))`.
In `submit()`, check `!this.form.valid` (or `this.form.pending`). Add a validator function on the
`lines` FormArray that sums the quantities.
