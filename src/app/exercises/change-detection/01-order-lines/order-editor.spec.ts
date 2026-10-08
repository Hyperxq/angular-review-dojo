import { TestBed } from '@angular/core/testing';
import { OrderEditor } from './order-editor';

describe('L1 - order editor', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(OrderEditor);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const click = async (label: string, nth = 0) => {
      [...el.querySelectorAll('button')]
        .filter((b) => (b.getAttribute('aria-label') ?? b.textContent)!.includes(label))
        [nth].click();
      await fixture.whenStable();
    };
    const rows = () => [...el.querySelectorAll('li')].map((li) => li.textContent?.replace(/\s+/g, ' ').trim());
    const summary = () => el.querySelector('[data-testid=summary]')!.textContent!.replace(/\s+/g, ' ').trim();
    return { el, click, rows, summary };
  };

  it('starts with one line', async () => {
    const { rows, summary } = await setup();

    expect(rows()).toHaveLength(1);
    expect(summary()).toBe('1 lines, 1 items, total $89.00');
  });

  it('shows a line as soon as it is added, and updates the summary', async () => {
    const { click, rows, summary } = await setup();

    await click('Add next product');

    expect(rows()).toHaveLength(2);
    expect(summary()).toBe('2 lines, 2 items, total $208.00');
  });

  it('removes a line from the screen as soon as it is removed', async () => {
    const { click, rows, summary } = await setup();
    await click('Add next product');

    await click('Remove', 0);

    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toContain('Ducky One 3 Keyboard');
    expect(summary()).toBe('1 lines, 1 items, total $119.00');
  });

  it('shows the new quantity in the row and in the summary', async () => {
    const { click, rows, summary } = await setup();

    await click('Increase');
    await click('Increase');

    expect(rows()[0]).toContain('3');
    expect(summary()).toBe('1 lines, 3 items, total $267.00');
  });

  it('never goes below one unit', async () => {
    const { click, summary } = await setup();

    await click('Decrease');

    expect(summary()).toBe('1 lines, 1 items, total $89.00');
  });

  it('shows the empty state when the last line is removed', async () => {
    const { click, rows } = await setup();

    await click('Remove');

    expect(rows()).toEqual(['No lines yet']);
  });
});
