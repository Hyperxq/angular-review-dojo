# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Two directives are composed on the dialog with `hostDirectives`. Check, one by one: what each
directive does when it starts, when its inputs change, and when it is destroyed. Then look at what the
dialog exposes to its users.

</details>

<details><summary>Hint 2 - area</summary>

- When is the list of focusable elements computed? Can the dialog content change afterwards?
- Which element had the focus before the dialog opened, and who remembers it?
- `effect()` can register listeners, but an effect re-runs. What does the callback you can register
  with `onCleanup` do, and what happens without it? Does `document.addEventListener` with a new arrow
  function each time dedupe?
- In `hostDirectives`, `inputs: ['enabled']` publishes the input of the host directive under its
  own name. Two host directives with the same public name share one binding. How do you rename one?

</details>

<details><summary>Hint 3 - near the answer</summary>

Query the focusable elements inside the key handler instead of caching them. Save
`document.activeElement` when the trap starts and restore it in `inject(DestroyRef).onDestroy`.
In the effect, `onCleanup(() => document.removeEventListener('click', handler))`, or replace the effect with a
`host: { '(document:click)': ... }` listener that checks `enabled()`. Alias the inputs in the dialog:
`inputs: ['enabled: trapFocus']` and `['enabled: closeOnOutsideClick']`.
