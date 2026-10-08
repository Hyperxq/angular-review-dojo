# L1 - Tooltip and highlight: solution

## What was wrong

1. **`innerHTML = this.text`.** Anything in the text is parsed as HTML, so
   `<img src=x onerror=...>` runs script (DOM XSS). When you build DOM by hand, use `textContent`.
   Angular templates escape interpolations for you; going around them with `ElementRef`/`document`
   removes that protection.
2. **`document.addEventListener` in `ngOnInit`, never removed.** The arrow function closes over
   `this`, so every instance of the directive that was ever created stays alive and keeps handling
   Escape. Three visits to a page with two tooltips = six handlers (the spec counts exactly that).
3. **The tooltip element lives in `document.body`, outside the component's view.** Angular cannot
   remove it when the host is destroyed; only the directive can, in `DestroyRef.onDestroy`.
4. **A signal input read once in the constructor** (`style.backgroundColor = this.color()`) is a
   snapshot. Direct `nativeElement.style` writes are not reactive. A `host` binding is: Angular
   re-evaluates `color()` and updates the style when the signal changes.

## The fix

```ts
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(document:keydown.escape)': 'hide()',   // added and removed by the framework
  },
})
export class Tooltip {
  readonly text = input('', { alias: 'appTooltip' });
  constructor() { inject(DestroyRef).onDestroy(() => this.hide()); }
  ...
  this.tip.textContent = this.text();
}

@Directive({ selector: '[appHighlight]', host: { '[style.backgroundColor]': 'color()' } })
export class Highlight { readonly color = input('#fff3a3'); }
```

## Modern Angular takeaway

- Prefer the `host` metadata over `@HostBinding`/`@HostListener` (the style guide recommends it); it
  supports `window:`/`document:` targets and key filters like `keydown.escape`, with automatic cleanup.
- `input()` with an alias (`input('', { alias: 'appTooltip' })`) replaces `@Input('appTooltip')` and allows
  `computed`/`effect` on it.
- Keep DOM writes declarative (host bindings, `Renderer2`) and always tie anything you create imperatively
  to `DestroyRef`.

## What a reviewer should say in the PR comment

> The tooltip uses `innerHTML` with text that is not ours: use `textContent`. The `document` keydown listener
> is never removed (use `host: { '(document:keydown.escape)': ... }`), the tooltip node is not removed
> when the directive is destroyed (`DestroyRef`), and `Highlight` writes the style once in the constructor
> instead of binding it, so it ignores later input changes.
