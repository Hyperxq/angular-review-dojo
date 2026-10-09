# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Open the component with your eyes closed: read the template as a screen reader would, element by element. Which elements
have a role? A name? Can you reach them with Tab?

</details>

<details><summary>Hint 2 - area</summary>

- Which HTML element gives you "focusable, announced as a button, activated by Enter and Space" for free?
- An icon-only button needs an **accessible name**. Which attribute provides one, and what should the icon glyph do
  so it is not read twice (`aria-hidden`)? What should the name say to be useful out of context?
- A placeholder is not a label. Which element, or attribute, names an `<input>`?
- What does a global `outline: none` on `:focus` do to a keyboard user? Which pseudo-class shows the ring only when the
  keyboard is being used?

</details>

<details><summary>Hint 3 - near the answer</summary>

Make the name a `<button type="button">`. Give the icon buttons `[attr.aria-label]="'Remove ' + product.name"` (and a
wishlist label that says what will happen) and mark the glyph `aria-hidden="true"`. Add `aria-label="Search products"`
to the search input and `[attr.aria-label]="'Quantity for ' + product.name"` to the quantity inputs. Replace the
`:focus` rule with a visible `:focus-visible` outline.

</details>

---

Tests won't catch colour contrast of the focus ring or the touch target size (24x24 CSS px minimum): they are audit
findings for a browser tool such as Lighthouse or axe.
