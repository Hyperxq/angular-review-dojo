import { TestBed } from '@angular/core/testing';
import { getByRole, queryAllByRole } from '../../../core/a11y-queries';
import { ConfirmDialog } from './confirm-dialog';
import { FilterWidgetsDemo } from './filter-widgets-demo';
import { NewsletterForm } from './newsletter-form';
import { SortDropdown } from './sort-dropdown';

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};

describe('L2 - filter widgets', () => {
  describe('sort dropdown', () => {
    async function render() {
      const fixture = TestBed.createComponent(SortDropdown);
      fixture.componentRef.setInput('label', 'Sort by');
      fixture.componentRef.setInput('options', ['Relevance', 'Newest', 'Price']);
      fixture.componentRef.setInput('value', 'Relevance');
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const trigger = () => root.querySelector<HTMLElement>('button.trigger')!;
      return { fixture, root, trigger };
    }

    it('is named after its label and its current value', async () => {
      const { root } = await render();

      expect(getByRole(root, 'button', { name: 'Sort by Relevance' })).toBeTruthy();
    });

    it('announces that it opens a listbox and whether it is open', async () => {
      const { fixture, trigger } = await render();
      expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
      expect(trigger().getAttribute('aria-expanded')).toBe('false');

      trigger().click();
      await fixture.whenStable();

      expect(trigger().getAttribute('aria-expanded')).toBe('true');
    });

    it('exposes the options and the selected one', async () => {
      const { fixture, root, trigger } = await render();
      trigger().click();
      await fixture.whenStable();

      const listbox = getByRole(root, 'listbox');
      expect(trigger().getAttribute('aria-controls')).toBe(listbox.id);
      const options = queryAllByRole(root, 'option');
      expect(options.map((o) => o.textContent?.trim())).toEqual(['Relevance', 'Newest', 'Price']);
      expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual([
        'true',
        'false',
        'false',
      ]);
    });

    it('is operated with the arrow keys and Enter', async () => {
      const { fixture, root, trigger } = await render();

      key(trigger(), 'ArrowDown');
      await fixture.whenStable();
      key(trigger(), 'ArrowDown');
      await fixture.whenStable();

      const options = queryAllByRole(root, 'option');
      expect(trigger().getAttribute('aria-activedescendant')).toBe(options[1].id);

      key(trigger(), 'Enter');
      await fixture.whenStable();

      expect(fixture.componentInstance.value()).toBe('Newest');
      expect(queryAllByRole(root, 'listbox')).toHaveLength(0);
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes with Escape without changing the value', async () => {
      const { fixture, root, trigger } = await render();
      trigger().click();
      await fixture.whenStable();

      key(trigger(), 'Escape');
      await fixture.whenStable();

      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(queryAllByRole(root, 'listbox')).toHaveLength(0);
      expect(fixture.componentInstance.value()).toBe('Relevance');
    });

    it('still selects with the mouse', async () => {
      const { fixture, root, trigger } = await render();
      trigger().click();
      await fixture.whenStable();

      root.querySelectorAll<HTMLElement>('.option')[2].click();
      await fixture.whenStable();

      expect(fixture.componentInstance.value()).toBe('Price');
    });
  });

  describe('confirm dialog', () => {
    async function render() {
      const fixture = TestBed.createComponent(FilterWidgetsDemo);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const opener = getByRole(root, 'button', { name: 'Delete account' });
      opener.focus();
      opener.click();
      await fixture.whenStable();
      return { fixture, root, opener };
    }

    it('is announced as a named modal dialog', async () => {
      const { root } = await render();

      const dialog = getByRole(root, 'dialog', { name: 'Delete account?' });
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('moves focus into the dialog when it opens', async () => {
      const { root } = await render();

      const dialog = getByRole(root, 'dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('keeps Tab and Shift+Tab inside the dialog', async () => {
      const { root } = await render();
      const dialog = getByRole(root, 'dialog');
      const buttons = queryAllByRole(dialog, 'button');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      last.focus();
      expect(key(last, 'Tab').defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);

      expect(key(first, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(last);
    });

    it('closes with Escape and gives the focus back to the opener', async () => {
      const { fixture, root, opener } = await render();

      key(getByRole(root, 'dialog'), 'Escape');
      await fixture.whenStable();

      expect(queryAllByRole(root, 'dialog')).toHaveLength(0);
      expect(document.activeElement).toBe(opener);
    });

    it('returns the focus after Cancel too', async () => {
      const { fixture, root, opener } = await render();
      expect(getByRole(root, 'dialog').contains(document.activeElement)).toBe(true);

      getByRole(root, 'button', { name: 'Cancel' }).click();
      await fixture.whenStable();

      expect(document.activeElement).toBe(opener);
    });

    it('confirms the action', async () => {
      const { fixture, root } = await render();

      getByRole(root, 'button', { name: 'Delete' }).click();
      await fixture.whenStable();

      expect(root.textContent).toContain('Account deleted.');
    });
  });

  describe('newsletter form', () => {
    async function submit(email: string) {
      const fixture = TestBed.createComponent(NewsletterForm);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const input = getByRole(root, 'textbox', { name: 'Email' }) as HTMLInputElement;
      input.value = email;
      input.dispatchEvent(new Event('input'));
      getByRole(root, 'button', { name: 'Subscribe' }).click();
      await fixture.whenStable();
      return { root, input };
    }

    it('is not marked invalid before anything is submitted', async () => {
      const fixture = TestBed.createComponent(NewsletterForm);
      await fixture.whenStable();

      const input = getByRole(fixture.nativeElement, 'textbox', { name: 'Email' });
      expect(input.getAttribute('aria-invalid')).not.toBe('true');
    });

    it('announces a validation error', async () => {
      const { root } = await submit('nope');

      expect(getByRole(root, 'alert').textContent).toContain('valid email');
    });

    it('marks the field invalid and connects it to the message', async () => {
      const { root, input } = await submit('nope');

      expect(input.getAttribute('aria-invalid')).toBe('true');
      const messageId = input.getAttribute('aria-describedby');
      expect(messageId).toBeTruthy();
      expect(root.querySelector(`[id="${messageId}"]`)).toBe(getByRole(root, 'alert'));
    });

    it('announces success politely', async () => {
      const { root } = await submit('ana@example.com');

      expect(getByRole(root, 'status').textContent).toContain('Thanks');
      expect(queryAllByRole(root, 'alert')).toHaveLength(0);
    });
  });
});
