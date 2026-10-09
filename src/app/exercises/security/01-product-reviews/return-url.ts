const DUMMY_ORIGIN = 'http://app.invalid';

/** Keeps only same-site targets; the URL parser applies the same rules as the browser. */
export function safeReturnUrl(raw: string | undefined): string {
  if (!raw) {
    return '/';
  }
  const url = new URL(raw, DUMMY_ORIGIN);
  return url.origin === DUMMY_ORIGIN ? url.pathname + url.search + url.hash : '/';
}
