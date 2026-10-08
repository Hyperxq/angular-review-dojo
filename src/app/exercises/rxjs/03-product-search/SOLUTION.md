# L3 - Product search: solution

## What was wrong

1. **`mergeMap` for the search.** It keeps every inner request alive and emits in arrival order, so
   a slow response for "ke" overwrote the response for "key".
2. **No `debounceTime`.** One request per keystroke.
3. **No `distinctUntilChanged`.** Re-entering the same term repeats the request.
4. **`switchMap` for the save.** A second click cancelled the first `PUT` on the client. The
   server may or may not have applied it, so the UI could not know the outcome, and a second
   request was still sent.

## The fix

```ts
this.term.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((term) => this.api.search(term)),
)
```

```ts
this.saveRequests.pipe(exhaustMap((product) => this.api.update(product)...))
```

## Choosing the flattening operator

| Operator | Previous inner | Use for |
|----------|----------------|---------|
| `switchMap` | cancelled | Reads where only the latest input matters: typeahead, route-param loading |
| `exhaustMap` | the new event is ignored while one runs | Submit/save buttons, login, anything that must not run twice at once |
| `concatMap` | the new event waits in a queue | Writes where every event matters and order matters (e.g. "add one more" clicks) |
| `mergeMap` | all run concurrently | Independent work where order does not matter (fire-and-forget logging, parallel uploads) |

Search is a read and only the latest term matters: `switchMap`. Saving is a write and cancelling
it does not undo it on the server: never `switchMap`. Here the second click is a duplicate of the
first, so `exhaustMap` fits. If each click were a distinct change (e.g. "restock +10"), `concatMap`.

## Modern Angular / RxJS takeaway

- Typeahead stays an RxJS problem: time (`debounceTime`) and cancellation (`switchMap`) are what
  the operators are for. `toSignal` is the bridge to the template.
- Choose the operator by answering "what happens to the old one?", not by habit.

## What a reviewer should say in the PR comment

> `mergeMap` lets stale responses overwrite newer ones and there is no debounce/distinct, so we
> fire a request per keystroke. Use `debounceTime` + `distinctUntilChanged` + `switchMap` for the
> search. For the save, `switchMap` cancels the in-flight `PUT` on a second click; use `exhaustMap`
> (or `concatMap` if each click is a distinct change) so a write is never cancelled client-side.
