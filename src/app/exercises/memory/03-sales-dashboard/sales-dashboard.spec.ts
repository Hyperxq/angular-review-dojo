import { TestBed } from '@angular/core/testing';
import { FakeChart } from './fake-chart';
import { SalesDashboard } from './sales-dashboard';
import { StatsService } from './stats.service';

describe('L3 - SalesDashboard', () => {
  afterEach(() => vi.restoreAllMocks());

  const create = async (series = [10, 20, 30]) => {
    const fixture = TestBed.createComponent(SalesDashboard);
    fixture.componentRef.setInput('series', series);
    await fixture.whenStable();
    return fixture;
  };

  it('shows the statistics of the series', async () => {
    const fixture = await create([10, 20, 30]);

    expect(fixture.nativeElement.querySelector('[data-testid=stats]').textContent.replace(/\s+/g, ' ').trim()).toBe(
      'mean 20, best 30, volatility 9',
    );
  });

  it('draws the series on the chart', async () => {
    const fixture = await create([1, 2, 3, 4]);

    expect(fixture.nativeElement.querySelector('.chart').dataset.points).toBe('4');
  });

  it('creates one chart for its whole life and only updates it when the data changes', async () => {
    const init = vi.spyOn(FakeChart.prototype, 'init');
    const update = vi.spyOn(FakeChart.prototype, 'update');
    const before = FakeChart.live;
    const fixture = await create([1, 2, 3]);

    fixture.componentRef.setInput('series', [1, 2, 3, 4]);
    await fixture.whenStable();
    fixture.componentRef.setInput('series', [1, 2, 3, 4, 5]);
    await fixture.whenStable();

    expect(init).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenLastCalledWith([1, 2, 3, 4, 5]);
    expect(FakeChart.live).toBe(before + 1);
  });

  it('destroys its chart together with itself', async () => {
    const destroy = vi.spyOn(FakeChart.prototype, 'destroy');
    const before = FakeChart.live;
    const fixture = await create();

    fixture.destroy();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(FakeChart.live).toBe(before);
  });

  it('does not recalculate the statistics while the user types in the filter', async () => {
    const compute = vi.spyOn(TestBed.inject(StatsService), 'compute');
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input')!;
    const callsAfterRender = compute.mock.calls.length;

    for (const text of ['n', 'no', 'nor']) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    }

    expect(el.querySelectorAll('.card')).toHaveLength(1);
    expect(compute).toHaveBeenCalledTimes(callsAfterRender);
    expect(callsAfterRender).toBe(1);
  });

  it('aligns the cards without interleaving layout reads and writes', async () => {
    const log: ('read' | 'write')[] = [];
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => {
      log.push('read');
      return 80;
    });
    const styleProto = Object.getPrototypeOf(document.createElement('div').style);
    const heightSetter = Object.getOwnPropertyDescriptor(styleProto, 'height')!.set!;
    vi.spyOn(styleProto, 'height', 'set').mockImplementation(function (this: CSSStyleDeclaration, value: string) {
      log.push('write');
      heightSetter.call(this, value);
    });
    const setProperty = CSSStyleDeclaration.prototype.setProperty;
    vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty').mockImplementation(function (this: CSSStyleDeclaration, ...args) {
      if (args[0] === 'height') log.push('write');
      return setProperty.apply(this, args);
    });

    const fixture = await create();

    const switches = log.filter((entry, i) => i > 0 && entry !== log[i - 1]).length;
    expect(log.filter((e) => e === 'read')).toHaveLength(4);
    expect(switches).toBeLessThanOrEqual(1);
    expect([...fixture.nativeElement.querySelectorAll('.card')].every((c: HTMLElement) => c.style.height === '80px')).toBe(true);
  });
});
