# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

For each widget, write down the **contract** a keyboard or screen reader user expects (the WAI-ARIA Authoring Practices
call it a pattern) and compare it with what the template provides: roles, states, keys, focus.

</details>

<details><summary>Hint 2 - area</summary>

- Dropdown: which `aria-*` attributes say "I open a listbox" (`aria-haspopup`), "I am open" (`aria-expanded`), "this is
  the highlighted option" (`aria-activedescendant`), "this option is chosen" (`aria-selected`)? Which keys should the
  trigger handle (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`)?
- Dialog: `role="dialog"`, `aria-modal="true"` and a name (`aria-labelledby`). When it opens, where should focus go? What
  must `Tab` and `Shift+Tab` do at the ends? Where must focus go when it closes? Remember it **before** you open.
- Errors: a message that appears later is only spoken if it is inside a live region (`role="alert"` is one). Which
  attributes connect the message to the input (`aria-describedby`) and mark it (`aria-invalid`)?

</details>

<details><summary>Hint 3 - near the answer</summary>

Dropdown: `aria-haspopup="listbox"`, `[attr.aria-expanded]`, `aria-controls`, `aria-activedescendant` on the trigger;
`role="listbox"` on the menu and `role="option"` + `aria-selected` + a stable `id` on the options; handle keys in
`(keydown)` on the trigger. Dialog: `afterRenderEffect` focuses Cancel when `open()` becomes true, a `(keydown)`
handler wraps Tab and closes on Escape, and the opener (`document.activeElement` at open time) gets focus back.
Form: render `<p id="email-error" role="alert">` and bind `[attr.aria-invalid]` and `[attr.aria-describedby]` on the input.

</details>

---

Tests won't catch whether the widget "feels right" with a real screen reader (announcement order, verbosity,
differences between NVDA, JAWS and VoiceOver): that needs manual testing. They check the contract.
