# L3 - Dialog kit: solution

## What was wrong

1. **`FocusTrap` cached the list of focusable elements once** (in `afterNextRender`). Controls
   added later (the "advanced" section) were not part of the loop. Query when the key is pressed:
   the cost is negligible and it can never be stale.
2. **No focus restoration.** A dialog should remember `document.activeElement` when it opens and give it
   back when it goes away. The trap now captures it in its constructor (before the first control is focused)
   and restores it in `DestroyRef.onDestroy`.
3. **`effect()` registering a `document` listener with no cleanup.** An effect re-runs whenever the signals
   it reads change. Each run added a new listener (a fresh arrow function never dedupes), nothing removed the
   old ones, turning the input off did nothing and the directive's own `OutputEmitterRef` was
   emitting after destruction (dev mode logs `NG0953: Unexpected emit for destroyed OutputRef` with
   `console.warn`). Either `effect((onCleanup) => { ...; onCleanup(() => remove) })` or, simpler, a
   `host: { '(document:click)': ... }` listener, which the framework adds and removes with the directive, and checks
   `enabled()` at event time.
4. **Both host directives published their `enabled` input under the same public name.**
   `hostDirectives: [{ directive: X, inputs: ['enabled'] }]` exposes the input as `enabled` on the
   component; two directives exposing the same name share one binding, so `[enabled]="false"` switched off the
   focus trap too. Alias them: `inputs: ['enabled: trapFocus']`, `inputs: ['enabled: closeOnOutsideClick']`.

## The fix (excerpts)

```ts
hostDirectives: [
  { directive: FocusTrap, inputs: ['enabled: trapFocus'] },
  { directive: ClickOutside, inputs: ['enabled: closeOnOutsideClick'], outputs: ['clickOutside: dismiss'] },
],
```
```ts
host: { '(document:click)': 'onDocumentClick($event)' }
...
if (this.enabled() && !this.host.nativeElement.contains(event.target as Node)) this.clickOutside.emit(event);
```

## Notes

- `hostDirectives` only exposes the inputs and outputs you list; everything else stays private to the
  composition. Listing them is an API decision for the component, treat it like a public method.
- `afterNextRender` runs once per component instance, after the first render, and only in the browser, so it is
  the right place for the initial focus (not `ngOnInit`).

## Modern Angular takeaway

- `hostDirectives` composes behaviour without inheritance or wrapper components; alias inputs deliberately.
- Prefer `host` event bindings over manual `addEventListener` inside effects. If you do register listeners
  in an effect, `onCleanup` is mandatory.

## What a reviewer should say in the PR comment

> The `effect` adds a new `document` click listener on every run and never removes any, so listeners pile up
> and keep emitting after the dialog is destroyed: use a `host` listener. The trap caches its focusable list at
> start (misses dynamic content) and never restores the previous focus. And `inputs: ['enabled']` on both
> host directives makes one binding drive both; alias them.
