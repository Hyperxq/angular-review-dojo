import { TestBed } from '@angular/core/testing';
import { BadgeDemo } from './badge-demo';

describe('L1 - ProductBadge', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(BadgeDemo);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const click = async (label: string) => {
      [...el.querySelectorAll('button')].find((b) => b.textContent === label)!.click();
      await fixture.whenStable();
    };
    const text = (selector: string) => el.querySelector(selector)?.textContent?.trim();
    return { el, click, text };
  };

  it('shows the product name and its category tag', async () => {
    const { text } = await setup();

    expect(text('h3')).toBe('Keychron K2 Keyboard');
    expect(text('.tag')).toBe('KEYBOARDS');
  });

  it('shows the tag of the product it is given', async () => {
    const { click, text } = await setup();

    await click('Next product');
    await click('Next product');
    await click('Next product');

    expect(text('h3')).toBe('Logitech MX Master 3S');
    expect(text('.tag')).toBe('MICE');
  });

  it('follows the stock of the product when the product changes', async () => {
    const { click, text } = await setup();
    expect(text('.discount')).toBeUndefined();

    for (let i = 0; i < 5; i++) {
      await click('Next product');
    }
    expect(text('h3')).toBe('Glorious Model O');
    expect(text('.discount')).toBe('20% off');

    await click('Next product');
    expect(text('h3')).toBe('Dell U2723QE 27" Monitor');
    expect(text('.discount')).toBeUndefined();
  });

  it('closes the details panel when another product is shown', async () => {
    const { el, click } = await setup();
    await click('Details');
    expect(el.querySelector('.details')).not.toBeNull();

    await click('Next product');

    expect(el.querySelector('.details')).toBeNull();
  });

  it('shows the discount once the product is down to 2 units', async () => {
    const { click, text } = await setup();

    for (let i = 0; i < 10; i++) {
      await click('Sell one');
    }

    expect(text('.discount')).toBe('20% off');
  });
});
