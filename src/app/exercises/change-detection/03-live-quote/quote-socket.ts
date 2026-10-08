import { Injectable, InjectionToken, inject } from '@angular/core';

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
}

/** Milliseconds between simulated ticks; 0 disables the automatic feed. */
export const QUOTE_FEED_INTERVAL = new InjectionToken<number>('QUOTE_FEED_INTERVAL', {
  factory: () => 1500,
});

/** Stand-in for a third-party websocket client: plain callbacks, no knowledge of Angular. */
@Injectable({ providedIn: 'root' })
export class QuoteSocket {
  private readonly intervalMs = inject(QUOTE_FEED_INTERVAL);
  private readonly handlers = new Set<(quote: Quote) => void>();
  private timer?: ReturnType<typeof setInterval>;
  closed = 0;

  connect() {
    if (this.intervalMs > 0 && this.timer === undefined) {
      this.timer = setInterval(() => {
        const price = 100 + Math.round(Math.random() * 500) / 100;
        this.simulate({ symbol: 'KB2', bid: price - 0.05, ask: price + 0.05, price });
      }, this.intervalMs);
    }
  }

  onMessage(handler: (quote: Quote) => void) {
    this.handlers.add(handler);
  }

  close() {
    this.closed++;
    this.handlers.clear();
    clearInterval(this.timer);
    this.timer = undefined;
  }

  simulate(quote: Quote) {
    this.handlers.forEach((handler) => handler(quote));
  }
}
