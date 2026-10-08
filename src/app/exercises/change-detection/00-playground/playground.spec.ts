import { TestBed } from '@angular/core/testing';
import { NOTE_DELAY_MS } from './cards';
import { Playground } from './playground';

/**
 * Documentation as tests: each case is one behaviour described in EXPLAINER.md. The cards are, in
 * DOM order: Eager, OnPush with plain fields, OnPush with signals.
 */
describe('change detection playground', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(Playground);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const [parent, eager, onPush, signals] = [...el.querySelectorAll('[data-checks]')];
    const counts = () => ({
      parent: Number(parent.textContent),
      eager: Number(eager.textContent),
      onPush: Number(onPush.textContent),
      signals: Number(signals.textContent),
    });
    const text = (testId: string) =>
      [...el.querySelectorAll(`[data-testid=${testId}]`)].map((e) => e.textContent?.trim());
    const click = async (label: string, nth = 0) => {
      [...el.querySelectorAll('button')].filter((b) => b.textContent!.includes(label))[nth].click();
      await fixture.whenStable();
    };
    const waitForTimers = async () => {
      await new Promise((resolve) => setTimeout(resolve, NOTE_DELAY_MS * 3));
      await fixture.whenStable();
    };
    return { counts, text, click, waitForTimers };
  };

  it('starts with every view rendered once', async () => {
    const { counts, text } = await setup();

    expect(counts()).toEqual({ parent: 1, eager: 1, onPush: 1, signals: 1 });
    expect(text('price')).toEqual(['$89.00', '$89.00', '$89.00']);
  });

  it('does not show a mutated input object in the OnPush cards, but the Eager card is refreshed with its parent', async () => {
    const { text, click } = await setup();

    await click('Mutate the product object');

    expect(text('price')).toEqual(['$99.00', '$89.00', '$89.00']);
  });

  it('shows a replaced input object in every card', async () => {
    const { text, click } = await setup();

    await click('Replace the product object');

    expect(text('price')).toEqual(['$99.00', '$99.00', '$99.00']);
  });

  it('an event in the parent refreshes the parent and its Eager child, and skips clean OnPush children', async () => {
    const { counts, click } = await setup();

    await click('Do nothing');

    expect(counts()).toEqual({ parent: 2, eager: 2, onPush: 1, signals: 1 });
  });

  it('a plain field written by a timer is not rendered by anything until a refresh reaches the view', async () => {
    const { text, click, waitForTimers } = await setup();

    await click('Set note in setTimeout', 0);
    await waitForTimers();
    expect(text('note')).toEqual(['', '', '']);

    await click('Do nothing');
    expect(text('note')).toEqual(['set by timer', '', '']);
  });

  it('an OnPush card with a plain field needs markForCheck to show a value written by a timer', async () => {
    const { text, click, waitForTimers } = await setup();

    await click('Set note in setTimeout', 1);
    await waitForTimers();
    await click('Do nothing');
    expect(text('note')[1]).toBe('');

    await click('Set note in setTimeout + markForCheck');
    await waitForTimers();
    expect(text('note')[1]).toBe('set by timer');
  });

  it('a signal written by a timer refreshes only the card that reads it', async () => {
    const { counts, text, click, waitForTimers } = await setup();
    await click('Set signal in setTimeout');
    const afterClick = counts();

    await waitForTimers();

    expect(text('note')[2]).toBe('set by timer');
    expect(counts()).toEqual({ ...afterClick, signals: afterClick.signals + 1 });
  });
});
