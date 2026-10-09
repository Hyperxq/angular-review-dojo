# L1 - Product rows: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | The product name is a `<div (click)>`: not focusable, no role, no Enter/Space activation. Keyboard and screen reader users cannot select a product. | **blocking** |
| 2 | Icon-only buttons (`♡`, `✕`) have no accessible name; the glyph is read as "black heart suit" / "multiplication x" and says nothing about the product. | **blocking** |
| 3 | The search and quantity inputs rely on a placeholder (or nothing) as their only name. | **blocking** |
| 4 | `button:focus, input:focus { outline: none }` removes the only keyboard focus indicator. | **blocking** (WCAG 2.4.7 Focus Visible) |
| 5 | The wishlist button does not expose its state (`aria-pressed` or a name that flips). | should-fix |
| 6 | Touch targets below 24x24 CSS px (WCAG 2.5.8). | nit |

## Why

The accessibility tree is built from **semantics**, not from looks. A native `<button>` brings role, focusability and keyboard
activation. A `<div (click)>` brings none, and re-adding them by hand (`role`, `tabindex`, `keydown.enter`, `keydown.space`)
is more code and still easy to get subtly wrong. Names come from, in order: `aria-labelledby`, `aria-label`, the native label
(`<label>`), content, `title`; a `placeholder` is only a fallback hint and vanishes while typing. Repeated icon buttons
must include the object they act on, otherwise a screen reader's "list of buttons" is a list of identical words.

## The fix

```html
<button type="button" class="name" (click)="select(product)">...</button>
<button type="button" [attr.aria-label]="'Remove ' + product.name"><span aria-hidden="true">✕</span></button>
<input type="search" aria-label="Search products" />
button:focus-visible, input:focus-visible { outline: 2px solid #1a56db; outline-offset: 2px; }
```

## What the tests can and cannot prove

The specs use a small `getByRole`-style helper (`src/app/core/a11y-queries.ts`): implicit roles for common elements and a
simplified accessible-name computation (aria-labelledby, aria-label, label, alt, content). It is not a real accessibility
engine and says nothing about contrast, target size or reading order. The focus rule is checked by scanning the `<style>` text,
a pragmatic proxy. Use axe or Lighthouse in CI for what unit tests cannot see.

## Tradeoffs and discussion

- **`aria-label` vs. visible text:** if a visible label exists, reference it (`aria-labelledby`) so the spoken and visible name
  match (WCAG 2.5.3 Label in Name).
- **`aria-pressed` toggle vs. changing the name:** use one. Changing the name ("Add ..." / "Remove ...") is clear for a
  one-shot action; `aria-pressed` suits a stable name like "Wishlist".

## What a reviewer should say in the PR comment

> **Blocking:** the product name is a clickable `div`, so keyboard and screen reader users can't select it: use a
> `<button type="button">`. **Blocking:** the heart and cross buttons have no accessible name; add `aria-label`s that
> include the product and hide the glyph. **Blocking:** search and quantity inputs need labels (a placeholder is not one).
> **Blocking:** `outline: none` removes the focus indicator: use `:focus-visible` styles. *Should-fix:* expose the
> wishlist state. *Nit:* check target sizes.
