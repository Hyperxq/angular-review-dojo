import { ChangeDetectionStrategy, Component, DoCheck, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { QuoteHistory } from './quote-history';
import { Quote, QuoteSocket } from './quote-socket';

@Component({
  selector: 'app-live-quote',
  imports: [QuoteHistory],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <h2>KB2</h2>
    <p data-testid="status">{{ status }}</p>
    @if (quote) {
      <p data-testid="price">{{ quote.price }}</p>
      <p data-testid="spread">spread {{ spread }}</p>
    }
    <app-quote-history [items]="history" />
  `,
})
export class LiveQuote implements OnInit, DoCheck, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly socket = inject(QuoteSocket);

  protected quote?: Quote;
  protected history: number[] = [];
  protected status = 'connecting';
  protected spread = 0;

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.socket.onMessage((quote) => {
        this.zone.run(() => {
          this.quote = quote;
          this.history.push(quote.price);
        });
      });
      this.socket.connect();
    });

    setTimeout(() => {
      this.status = 'live';
    }, 300);
  }

  ngDoCheck() {
    this.spread = this.quote ? Math.round((this.quote.ask - this.quote.bid) * 100) / 100 : 0;
  }

  ngOnDestroy() {
    console.debug('LiveQuote destroyed');
  }
}
