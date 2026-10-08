import { TestBed } from '@angular/core/testing';
import { LiveQuote } from './live-quote';
import { QUOTE_FEED_INTERVAL, QuoteSocket } from './quote-socket';

describe('L3 - LiveQuote', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: QUOTE_FEED_INTERVAL, useValue: 0 }] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = async () => {
    const fixture = TestBed.createComponent(LiveQuote);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const socket = TestBed.inject(QuoteSocket);
    const text = (id: string) => el.querySelector(`[data-testid=${id}]`)?.textContent?.trim();
    const history = () => [...el.querySelectorAll('li')].map((li) => li.textContent);
    return { fixture, el, socket, text, history };
  };

  it('starts connecting, with no quote', async () => {
    const { text } = await setup();

    expect(text('status')).toBe('connecting');
    expect(text('price')).toBeUndefined();
  });

  it('shows a quote and its spread as soon as the socket delivers it', async () => {
    const { fixture, socket, text } = await setup();

    socket.simulate({ symbol: 'KB2', bid: 101.45, ask: 101.55, price: 101.5 });
    await fixture.whenStable();

    expect(text('price')).toBe('101.5');
    expect(text('spread')).toBe('spread 0.1');
  });

  it('keeps the history of prices, newest last', async () => {
    const { fixture, socket, history } = await setup();

    socket.simulate({ symbol: 'KB2', bid: 100, ask: 101, price: 100.5 });
    await fixture.whenStable();
    socket.simulate({ symbol: 'KB2', bid: 101, ask: 102, price: 101.5 });
    await fixture.whenStable();

    expect(history()).toEqual(['100.5', '101.5']);
  });

  it('switches to live after 300 ms', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(LiveQuote);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid=status]')?.textContent).toBe('live');
  });

  it('stops listening and closes the socket when destroyed', async () => {
    const { fixture, socket } = await setup();

    fixture.destroy();

    expect(socket.closed).toBe(1);
  });

  it('does not leave a timer behind when destroyed before it fires', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(LiveQuote);
    fixture.detectChanges();

    fixture.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});
