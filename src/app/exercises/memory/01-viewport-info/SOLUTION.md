# L1 - Viewport info: solution

## What was wrong

Three things were started in `ngOnInit` and nothing stopped them:

1. `window.addEventListener('resize', fn)`: the browser holds `fn` (and, through its closure, `this`, the whole
   component, its signals and its view) until `removeEventListener` is called with the same function reference. An anonymous
   arrow function makes that impossible.
2. `renderer.listen('document', 'keydown', fn)`: `Renderer2.listen` returns an *unlisten* function. For element listeners in
   the component's own template the framework cleans up; for `window`/`document` targets registered by hand, the returned
   function is yours to call. It was thrown away.
3. `setInterval`: the callback keeps firing for the life of the page, and keeps the component alive through its closure.

Each visit added two listeners and one timer. This is the classic "detached component" leak: the component is gone from
the DOM but still **reachable** from a global (window, document, the timer list), so the garbage collector cannot free it.

## The fix

```ts
host: {
  '(window:resize)': 'measure()',        // added on creation, removed on destroy by the framework
  '(document:keydown)': 'lastKey.set($event.key)',
},
...
const clock = setInterval(() => this.now.set(new Date()), 1000);
inject(DestroyRef).onDestroy(() => clearInterval(clock));
```

## Modern Angular takeaway

- Prefer declarative listeners: `host` event bindings (`window:`/`document:` targets, key filters such as
  `keydown.escape`) or template event bindings. Zero cleanup code.
- For everything imperative, pair creation with `DestroyRef.onDestroy` **at the point of creation** (the constructor), so
  the cleanup cannot be forgotten and the class needs no `ngOnDestroy`.
- `Renderer2.listen` is fine, but store and call what it returns.
- How to see it: open the profiling guide (`GUIDE.md` in this topic), watch **JS event listeners** in the Performance
  monitor while navigating in and out.

## What a reviewer should say in the PR comment

> `ngOnInit` registers a `window` listener, a `document` listener (return value of `renderer.listen` ignored) and an
> interval, and nothing removes them, so every visit leaks a component. Use `host` listeners and
> `DestroyRef.onDestroy(() => clearInterval(...))`.
