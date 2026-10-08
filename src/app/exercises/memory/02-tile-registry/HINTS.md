# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Both problems are the same shape: a long-lived object (a root service) points to short-lived objects. Draw the chain
`root injector -> service -> Map -> thing`. Who removes the entry, and when?

</details>

<details><summary>Hint 2 - area</summary>

- `TileRegistry` is `providedIn: 'root'`: it lives as long as the application. Tiles live as long as they are on screen.
  Registering has a counterpart.
- What is the cache storing for each query besides the text? Does a cached text need the element? What happens to
  an element that was removed from the page but is still referenced from a `Map`?
- The key is whatever the user typed. How many different keys can there be? What should happen when the
  cache is full?
- `WeakRef` and `WeakMap`: when are they the right tool, and when do they just hide the lifecycle?

</details>

<details><summary>Hint 3 - near the answer</summary>

Make `register()` return an unregister function and call it in `inject(DestroyRef).onDestroy(...)`. In the cache, store only
the text, cap the size (a `Map` keeps insertion order: on a hit delete and re-insert the key, and when `size > MAX` delete
the first key) and look up elements through the component, not through the cache.

</details>
