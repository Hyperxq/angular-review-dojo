import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';

export const SERVER_PLATFORM = { provide: PLATFORM_ID, useValue: 'server' };

/** Angular decides "am I on the server" for `afterNextRender`, the HTTP transfer cache, etc. from this global. */
export function enterServerMode(): void {
  vi.stubGlobal('ngServerMode', true);
}

/**
 * Approximates the Node render environment: there is no `window` or Web Storage there.
 * jsdom stays available to Angular itself (the injected DOCUMENT keeps working), so call
 * this after the TestBed has resolved `DOCUMENT` and undo it with `vi.unstubAllGlobals()`.
 */
export function stubBrowserGlobals(): void {
  enterServerMode();
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('localStorage', undefined);
  vi.stubGlobal('sessionStorage', undefined);
}
