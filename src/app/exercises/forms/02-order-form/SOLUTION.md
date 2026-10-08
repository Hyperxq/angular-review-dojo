# L2 - Order form: solution

## What was wrong

1. **`QuantityStepper` only implemented one direction of the `ControlValueAccessor` contract.** It
   rendered the value the form wrote in (`writeValue`) but never told the form about user
   changes: `registerOnChange` stored a callback nobody called. The same for
   `registerOnTouched` (ignored) and `setDisabledState` (missing). Result: the screen and the
   form model diverged silently.
2. **No debounce in the async validator.** Angular runs it for every value change and cancels the
   previous run, but the HTTP request had already been sent. `timer(300).pipe(switchMap(...))` makes the
   validator wait: if the value changes again within 300 ms, the previous subscription is dropped
   *before* the request starts.
3. **`form.invalid` is `false` while the form is `PENDING`.** `invalid` means "status is INVALID";
   a form waiting for an async validator is neither valid nor invalid. Gate submission on `valid`.
4. **The 10-unit limit was a per-line `Validators.max(10)`.** A rule about several controls belongs on
   the control that contains them: a `ValidatorFn` on the `FormArray` that sums the lines.

## The fix

```ts
step(delta: number) {
  this.value.update((v) => Math.max(1, v + delta));
  this.onChange(this.value());
}
registerOnTouched(fn: () => void) { this.onTouched = fn; }
setDisabledState(isDisabled: boolean) { this.disabled.set(isDisabled); }
```
```ts
timer(debounceMs).pipe(switchMap(() => api.isAvailable(control.value)), map(...))
lines: this.fb.array([this.newLine()], totalQuantityWithin(10))
if (!this.form.valid) return;
```

## Modern Angular takeaway

- For new custom controls in Signal Forms you do not write a `ControlValueAccessor` at all (see
  the L3 exercise), but reactive-forms CVAs are everywhere in existing code and must honour all
  four parts of the contract: `writeValue`, `registerOnChange`, `registerOnTouched`,
  `setDisabledState`.
- Status has four values: `VALID`, `INVALID`, `PENDING`, `DISABLED`. Code that checks only `invalid`
  has a hole for `PENDING`.
- Validators attach to the narrowest control that can see all the data the rule needs.

## What a reviewer should say in the PR comment

> The stepper never calls the registered `onChange`, so the form always keeps its initial quantity,
> and it ignores touched/disabled. The async validator fires a request per keystroke (debounce with
> `timer` + `switchMap`), and `submit()` checks `invalid`, which is `false` while the check is
> pending. The 10-unit limit has to be a validator on the `lines` array, not on each line.
