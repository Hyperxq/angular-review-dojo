# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Three different mistakes, all of them visible just by reading the class. Look at the types first:
what does the compiler know about `form.value`?

</details>

<details><summary>Hint 2 - area</summary>

- What is included in `FormGroup.value`? Is there another accessor that includes everything?
- Each built-in validator targets one kind of value. What does `Validators.min` compare, and
  what is its counterpart for text?
- When does the template decide that an error is worth showing? Who sets that state when the user
  never touched the field?

</details>

<details><summary>Hint 3 - near the answer</summary>

Use typed forms: `inject(NonNullableFormBuilder).group({...})`, which gives `form.getRawValue()`
typed as `{ email: string; displayName: string; age: number }`, so the compiler checks the
payload. Use `Validators.minLength(3)` for text. On an invalid submit call `form.markAllAsTouched()`.
