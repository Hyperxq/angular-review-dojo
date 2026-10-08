import { TestBed } from '@angular/core/testing';
import { DialogDemo } from './dialog-demo';

describe('L3 - Dialog kit', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  const warnings = () => warn.mock.calls.map((call: unknown[]) => String(call[0]));

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  const setup = async () => {
    const fixture = TestBed.createComponent(DialogDemo);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent === label)!;
    const click = async (target: HTMLElement) => {
      target.click();
      await fixture.whenStable();
    };
    const dialog = () => el.querySelector('[role=dialog]');
    const tab = (target: HTMLElement, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event;
    };
    return { fixture, el, button, click, dialog, tab };
  };

  it('opens with the focus on the first control', async () => {
    const { button, click } = await setup();

    await click(button('Open settings'));

    expect(document.activeElement?.textContent).toBe('First option');
  });

  it('keeps Tab inside the dialog, wrapping from the last control to the first', async () => {
    const { button, click, tab } = await setup();
    await click(button('Open settings'));
    button('Close').focus();

    const event = tab(button('Close'));

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.textContent).toBe('First option');
  });

  it('wraps Shift+Tab from the first control to the last', async () => {
    const { button, click, tab } = await setup();
    await click(button('Open settings'));

    tab(button('First option'), true);

    expect(document.activeElement?.textContent).toBe('Close');
  });

  it('includes controls that appear after the dialog opened', async () => {
    const { button, click, tab } = await setup();
    await click(button('Open settings'));
    await click(button('Show advanced'));
    button('Advanced option').focus();

    tab(button('Advanced option'));

    expect(document.activeElement?.textContent).toBe('First option');
  });

  it('gives the focus back to the control that opened the dialog', async () => {
    const { button, click, dialog } = await setup();
    const trigger = button('Open settings');
    trigger.focus();
    await click(trigger);

    await click(button('Close'));

    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a click outside', async () => {
    const { el, click, button, dialog } = await setup();
    await click(button('Open settings'));

    await click(el.querySelector('#outside')!);

    expect(dialog()).toBeNull();
  });

  it('does not close on a click inside', async () => {
    const { click, button, dialog } = await setup();
    await click(button('Open settings'));

    await click(button('First option'));

    expect(dialog()).not.toBeNull();
  });

  it('ignores outside clicks while "Close on outside click" is off', async () => {
    const { el, click, button, dialog } = await setup();
    await click(button('Open settings'));
    await click(el.querySelector('input[type=checkbox]')!);

    await click(el.querySelector('#outside')!);

    expect(dialog()).not.toBeNull();
  });

  it('keeps trapping the focus while outside clicks are ignored', async () => {
    const { el, click, button, tab } = await setup();
    await click(button('Open settings'));
    await click(el.querySelector('input[type=checkbox]')!);
    button('Close').focus();

    const event = tab(button('Close'));

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.textContent).toBe('First option');
  });

  it('keeps working after the setting is switched off and on again', async () => {
    const { el, click, button, dialog } = await setup();
    await click(button('Open settings'));
    const checkbox = el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    await click(checkbox);
    await click(checkbox);

    await click(el.querySelector('#outside')!);

    expect(dialog()).toBeNull();
    expect(warnings()).toEqual([]);
  });

  it('stops listening to the page once the dialog is gone', async () => {
    const { el, click, button } = await setup();
    await click(button('Open settings'));
    await click(button('Close'));

    await click(el.querySelector('#outside')!);

    expect(warnings()).toEqual([]);
  });
});
