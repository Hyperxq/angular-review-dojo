import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';

/** A full page load, so that every in-memory store starts clean for the new session. */
export const HARD_REDIRECT = new InjectionToken<(url: string) => void>('HARD_REDIRECT', {
  factory: () => {
    const location = inject(DOCUMENT).location;
    return (url) => location.assign(url);
  },
});
