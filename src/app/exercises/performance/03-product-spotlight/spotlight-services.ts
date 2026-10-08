import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Analytics {
  track(event: string, data: Record<string, unknown>) {
    console.debug('[analytics]', event, data);
  }
}

@Injectable({ providedIn: 'root' })
export class SpotlightCart {
  readonly count = signal(0);

  add() {
    this.count.update((n) => n + 1);
  }
}
