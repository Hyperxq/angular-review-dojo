import { TestBed } from '@angular/core/testing';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductSpotlight } from './product-spotlight';
import { Analytics } from './spotlight-services';

describe('L3 - ProductSpotlight', () => {
  const [first, second] = SEED_PRODUCTS;
  let track: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    track = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: Analytics, useValue: { track } }] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const create = async () => {
    const fixture = TestBed.createComponent(ProductSpotlight);
    fixture.componentRef.setInput('product', first);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  it('shows the product', async () => {
    const { el } = await create();

    expect(el.textContent).toContain(first.name);
    expect(el.querySelector('[role=status]')).not.toBeNull();
  });

  it('hides the promo banner after three seconds', async () => {
    vi.useFakeTimers();
    const { fixture, el } = await create();

    await vi.advanceTimersByTimeAsync(3000);
    fixture.detectChanges();

    expect(el.querySelector('[role=status]')).toBeNull();
  });

  it('shows the offline notice as soon as the browser goes offline, and removes it when back', async () => {
    const { fixture, el } = await create();

    window.dispatchEvent(new Event('offline'));
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')).not.toBeNull();

    window.dispatchEvent(new Event('online'));
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')).toBeNull();
  });

  it('loads the hero picture as a high-priority image', async () => {
    const { el } = await create();
    const img = el.querySelector('img')!;

    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('width')).toBe('1200');
  });

  it('reports a view for the product, not for every cart click', async () => {
    const { fixture, el } = await create();
    await fixture.whenStable();
    expect(track).toHaveBeenCalledTimes(1);

    el.querySelector('button')!.click();
    await fixture.whenStable();
    expect(track).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('product', second);
    await fixture.whenStable();
    expect(track).toHaveBeenCalledTimes(2);
    expect(track.mock.calls[1][1]).toMatchObject({ productId: second.id });
  });
});
