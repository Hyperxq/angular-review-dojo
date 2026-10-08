# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Four small defects in two directives. For each one ask: "who creates this, who undoes it, and what
happens when the input changes?"

</details>

<details><summary>Hint 2 - area</summary>

- What is the difference between setting `innerHTML` and `textContent` when the text is not
  yours?
- `document.addEventListener(...)` registered by hand needs a matching `removeEventListener`.
  Angular can do both for you: look at the `host` metadata of a directive and at `DestroyRef`.
- A signal input read once in the constructor is a snapshot. How does a directive keep a style in step with an input?

</details>

<details><summary>Hint 3 - near the answer</summary>

Set `textContent`. Replace the manual listener and the `@HostListener` decorators with `host: { '(mouseenter)': 'show()', '(mouseleave)': 'hide()', '(document:keydown.escape)': 'hide()' }`
and remove the tooltip element in `inject(DestroyRef).onDestroy(...)`. For the highlight, bind
the style: `host: { '[style.backgroundColor]': 'color()' }`.
