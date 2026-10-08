import { TestBed } from '@angular/core/testing';
import { ViewportInfo } from './viewport-info';

describe('L1 - ViewportInfo', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const visit = async () => {
    const fixture = TestBed.createComponent(ViewportInfo);
    await fixture.whenStable();
    return fixture;
  };

  it('follows the window size', async () => {
    const fixture = await visit();
    const el = fixture.nativeElement as HTMLElement;

    Object.assign(window, { innerWidth: 800, innerHeight: 600 });
    window.dispatchEvent(new Event('resize'));
    await fixture.whenStable();

    expect(el.querySelector('[data-testid=size]')!.textContent).toBe('800 x 600');
  });

  it('shows the last key pressed', async () => {
    const fixture = await visit();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid=key]').textContent).toBe('Last key: k');
  });

  it('ticks the clock every second while it is on screen', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T10:00:00') });
    const fixture = TestBed.createComponent(ViewportInfo);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(2000);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid=clock]').textContent).toContain('10:00:02');
  });

  it('leaves no window or document listeners behind after repeated visits', async () => {
    const added = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removed = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    const net = (type: string) =>
      added.mock.calls.filter(([t]) => t === type).length -
      removed.mock.calls.filter(([t]) => t === type).length;

    for (let i = 0; i < 3; i++) {
      (await visit()).destroy();
    }

    expect(net('resize')).toBe(0);
    expect(net('keydown')).toBe(0);
  });

  it('leaves no timers behind after repeated visits', () => {
    vi.useFakeTimers();

    for (let i = 0; i < 3; i++) {
      const fixture = TestBed.createComponent(ViewportInfo);
      fixture.detectChanges();
      fixture.destroy();
    }

    expect(vi.getTimerCount()).toBe(0);
  });
});
