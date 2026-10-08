# L2 - Tile registry: solution

## What was wrong

Both defects are **retention**: a long-lived object holds a reference to a short-lived one, so the garbage collector
cannot reclaim it. The path in a heap snapshot's **Retainers** pane reads
`root injector -> TileRegistry -> Map -> ProductTile -> (its view, its DOM)`.

1. **`TileRegistry` never unregistered.** `register(tile)` put the instance in a `Map` owned by a root service
   (lifetime = the whole application) and nothing took it out. Every show/hide cycle added 12 tiles that were
   already removed from the page. Because the registry also *called* them, destroyed components were still being
   written to.
2. **`PreviewCache` was unbounded and held DOM.** The key is user input (infinite domain), so the map grew with
   every distinct search term. Each entry also kept `host`: the element of the component that rendered it first. When
   that component was destroyed the element became a **detached DOM node** that stayed alive because the cache
   referenced it, along with everything it references (its component, bindings, listeners).

## The fix

```ts
// registry: the creator of the entry owns its removal
register(tile: ProductTile) { ...; return () => this.tiles.delete(id); }
this.destroyRef.onDestroy(this.registry.register(this));
```
```ts
// cache: data not instances, bounded, least-recently-used eviction
private readonly cache = new Map<string, string>();
render(query: string) {
  const hit = this.cache.get(query);
  if (hit !== undefined) { this.cache.delete(query); this.cache.set(query, hit); return hit; }   // refresh recency
  ...
  if (this.cache.size > PREVIEW_CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value!);  // oldest
}
```
A `Map` iterates in insertion order, so "first key" is the least recently used once hits re-insert their key.

## Tradeoffs: `WeakRef` / `WeakMap`

- A `WeakMap<object, V>` is the right tool when the *key* is an object whose lifetime you do not control and the value
  should live exactly as long as it (per-instance metadata). It cannot be keyed by strings and it cannot be iterated or sized.
- `WeakRef` (+ `FinalizationRegistry`) lets an entry disappear when its target is collected, but *when* is up to the engine:
  behaviour is non-deterministic, impossible to unit test, and it hides the real question (who owns the lifetime).
- For a registry of live components, explicit unregister in `onDestroy` is simpler and deterministic. For a cache of derived
  data, a size bound (LRU, or TTL) is what keeps memory flat. Reach for weak references only when neither is possible.

## Modern Angular takeaway

- Anything a component hands to a root-level service (itself, a callback, an element) needs a matching removal in
  `DestroyRef.onDestroy`. Returning the "undo" function from `register()` makes the contract hard to forget.
- Store data in shared caches, not instances or DOM nodes. Data can be serialised, inspected and bounded.
- The unit test pattern: create and destroy N times, then assert the service's size is back at baseline.

## What a reviewer should say in the PR comment

> `TileRegistry` is a root service that stores component instances and never removes them, so every destroyed tile leaks
> (and still receives `highlight()`): return an unregister function and call it in `onDestroy`. `PreviewCache` is unbounded
> over user input and retains host elements; cache the text only and cap it (LRU).
