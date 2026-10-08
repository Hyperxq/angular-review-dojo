# S3 - Hints

<details><summary>Hint 1 - nudge</summary>

There are three hand-maintained pieces of state (`product`, `loading`, `error`) that must always
agree with one request. Count how many code paths set each of them.

</details>

<details><summary>Hint 2 - area</summary>

Follow what happens to the `paramMap` pipeline after the first error: where does an error in the
inner request travel, and is anyone still subscribed to the route afterwards? Also check which
paths turn `loading` off and which clear `error`.

</details>

<details><summary>Hint 3 - near the answer</summary>

Let the router hand the id over (`withComponentInputBinding()` is already enabled): declare
`id = input.required({ transform: numberAttribute })` and load with
`rxResource({ params: () => this.id(), stream: ({ params }) => this.api.get(params) })`.
`isLoading()`, `error()` and `value()` are computed from the one request, and a new id cancels the
previous request and clears the error.

</details>
