import { TestBed } from '@angular/core/testing';
import { ProductActions } from './product-actions';

describe('L1 - Tooltip and Highlight', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(ProductActions);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent === label)!;
    return { fixture, el, button };
  };
  const tips = () => document.body.querySelectorAll('[role=tooltip]');

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.querySelectorAll('[role=tooltip]').forEach((t) => t.remove());
  });

  it('shows the tooltip while hovering and hides it on leave', async () => {
    const { button } = await setup();

    button('Delete').dispatchEvent(new Event('mouseenter'));
    expect(tips()).toHaveLength(1);
    expect(tips()[0].textContent).toBe('Remove this product from the catalog');

    button('Delete').dispatchEvent(new Event('mouseleave'));
    expect(tips()).toHaveLength(0);
  });

  it('closes the tooltip on Escape', async () => {
    const { button } = await setup();
    button('Delete').dispatchEvent(new Event('mouseenter'));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(tips()).toHaveLength(0);
  });

  it('renders the tooltip text as plain text, never as markup', async () => {
    const { button } = await setup();

    button('Save').dispatchEvent(new Event('mouseenter'));

    expect(tips()[0].textContent).toBe('Save <b>all</b> changes');
    expect(tips()[0].querySelector('b')).toBeNull();
  });

  it('removes its tooltip when the host is destroyed while hovering', async () => {
    const { fixture, button } = await setup();
    button('Delete').dispatchEvent(new Event('mouseenter'));

    fixture.destroy();

    expect(tips()).toHaveLength(0);
  });

  it('does not leave document listeners behind after being destroyed', async () => {
    const added = vi.spyOn(document, 'addEventListener');
    const removed = vi.spyOn(document, 'removeEventListener');
    const count = (spy: typeof added, type: string) => spy.mock.calls.filter(([t]) => t === type).length;

    for (let visit = 0; visit < 3; visit++) {
      const { fixture } = await setup();
      fixture.destroy();
    }

    expect(count(added, 'keydown')).toBe(count(removed, 'keydown'));
  });

  it('keeps the highlight in step with its colour input', async () => {
    const { fixture, button } = await setup();
    expect(button('Save').style.backgroundColor).toBe('rgb(255, 243, 163)');

    button('Toggle highlight colour').click();
    await fixture.whenStable();

    expect(button('Save').style.backgroundColor).toBe('rgb(184, 245, 192)');
  });
});
