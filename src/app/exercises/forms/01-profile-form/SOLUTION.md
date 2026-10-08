# L1 - Profile form: solution

## What was wrong

1. **`UntypedFormGroup` hides everything from the compiler.** `form.value` is `any`, so
   `saved.emit(this.form.value)` type-checks no matter what is inside. With a typed group the
   compiler would have complained that `{ displayName; age }` is not a `ProfilePayload` (see 2).
2. **`FormGroup.value` leaves out disabled controls.** The read-only email is a disabled control, so it
   was missing from the payload. `getRawValue()` returns every control, enabled or not.
3. **`Validators.min(3)` on a string.** `min`/`max` compare numbers; for non-numeric input they
   return `null` (valid). The text validator is `minLength`.
4. **Invalid submit without `markAllAsTouched()`.** The template shows errors only for touched
   controls (a good rule), but a user who never focused a field never touched it, so nothing was
   shown.

## The fix

```ts
protected readonly form = inject(NonNullableFormBuilder).group({
  email: [{ value: 'ada@example.com', disabled: true }],
  displayName: ['', [Validators.required, Validators.minLength(3)]],
  age: [30, [Validators.required, Validators.min(18)]],
});

if (this.form.invalid) { this.form.markAllAsTouched(); return; }
this.saved.emit(this.form.getRawValue());
```

`NonNullableFormBuilder` also makes `reset()` go back to the initial values instead of `null`,
and the controls are typed `FormControl<string>`, not `FormControl<string | null>`.

## Modern Angular takeaway

- Typed reactive forms (since v14) are the default. `UntypedFormGroup`/`FormGroup<any>` exist
  for migration and should be a review flag.
- `value` = enabled controls only; `getRawValue()` = everything.
- Validators are kind-specific: `min`/`max` for numbers, `minLength`/`maxLength` for text/arrays.

## What a reviewer should say in the PR comment

> `UntypedFormGroup` makes `form.value` `any`, which is how a payload missing the disabled
> `email` compiles. Use `NonNullableFormBuilder` and `getRawValue()`. `Validators.min(3)` does nothing
> on a string; it should be `minLength(3)`. And on an invalid submit call `markAllAsTouched()` so the
> user sees the errors.
