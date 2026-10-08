import { TestBed } from '@angular/core/testing';
import { ChartFrame } from './chart-frame';
import { TickCalculator } from './tick-calculator';

describe('L2 - ChartFrame', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('plot') ? 300 : 0;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const create = async (showLegend = false) => {
    const fixture = TestBed.createComponent(ChartFrame);
    fixture.componentRef.setInput('showLegend', showLegend);
    await fixture.whenStable();
    return fixture;
  };

  it('announces the legend politely', async () => {
    const fixture = await create(true);

    expect(fixture.nativeElement.querySelector('.legend').getAttribute('aria-live')).toBe('polite');
  });

  it('still announces a legend that is shown later', async () => {
    const fixture = await create(false);

    fixture.componentRef.setInput('showLegend', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.legend').getAttribute('aria-live')).toBe('polite');
  });

  it('shows the measured width and the ticks for it as soon as the chart is rendered', async () => {
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid=width]')!.textContent).toBe('Width: 300px');
    expect([...el.querySelectorAll('.ticks li')].map((li) => li.textContent)).toEqual(['0', '100', '200', '300']);
  });

  it('calculates ticks when the width changes, not on every change detection pass', async () => {
    const ticks = vi.spyOn(TestBed.inject(TickCalculator), 'ticks');
    const fixture = await create();
    const callsAfterRender = ticks.mock.calls.length;

    for (let i = 0; i < 3; i++) {
      fixture.componentRef.setInput('showLegend', i % 2 === 0);
      await fixture.whenStable();
    }

    expect(callsAfterRender).toBeLessThanOrEqual(2);
    expect(ticks.mock.calls.length).toBe(callsAfterRender);
  });
});
