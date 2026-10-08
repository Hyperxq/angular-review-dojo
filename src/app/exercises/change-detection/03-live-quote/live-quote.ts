import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { QuoteHistory } from './quote-history';
import { Quote, QuoteSocket } from './quote-socket';

@Component({
  selector: 'app-live-quote',
  imports: [QuoteHistory],
  template: `
    <h2>KB2</h2>
    <p data-testid="status">{{ status() }}</p>
    @if (quote(); as q) {
      <p data-testid="price">{{ q.price }}</p>
      <p data-testid="spread">spread {{ spread() }}</p>
    }
    <app-quote-history [items]="history()" />
  `,
})
export class LiveQuote {
  private readonly socket = inject(QuoteSocket);

  protected readonly quote = signal<Quote | null>(null);
  protected readonly history = signal<number[]>([]);
  protected readonly status = signal('connecting');
  protected readonly spread = computed(() => {
    const quote = this.quote();
    return quote ? Math.round((quote.ask - quote.bid) * 100) / 100 : 0;
  });

  constructor() {
    this.socket.onMessage((quote) => {
      this.quote.set(quote);
      this.history.update((prices) => [...prices, quote.price]);
    });
    this.socket.connect();

    const liveTimer = setTimeout(() => this.status.set('live'), 300);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(liveTimer);
      this.socket.close();
    });
  }
}
