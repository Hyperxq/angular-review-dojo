import { TestBed } from '@angular/core/testing';
import { loadSources } from '../../../core/architecture-rules';
import { getByRole } from '../../../core/a11y-queries';
import { ShopDemo } from './shop-demo';

const ROOT = 'src/app/exercises/architecture/03-shop';
const FEATURES = ['catalog', 'cart', 'wishlist', 'notifications', 'orders'];
const sources = loadSources(ROOT);
const moduleOf = (path: string) => (path.includes('/') ? path.split('/')[0] : 'root');

describe('L3 - shop behaviour (must survive the refactor)', () => {
  async function render() {
    const fixture = TestBed.createComponent(ShopDemo);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const click = async (name: string) => {
      getByRole(root, 'button', { name }).click();
      await fixture.whenStable();
    };
    return { fixture, root, click };
  }

  it('filters the catalog while typing', async () => {
    const { fixture, root } = await render();
    const search = getByRole(root, 'searchbox', { name: 'Search products' }) as HTMLInputElement;

    search.value = 'logitech';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(root.querySelectorAll('.products li')).toHaveLength(1);
  });

  it('adds to the cart, counts, totals and notifies', async () => {
    const { root, click } = await render();

    await click('Add Keychron K2 Keyboard to cart');
    await click('Add Keychron K2 Keyboard to cart');

    expect(root.querySelector('.cart-count')?.textContent).toContain('Cart (2)');
    expect(root.querySelector('.cart-total')?.textContent).toContain('$178.00');
    expect(root.querySelector('.cart-lines')?.textContent).toContain('2 x Keychron K2 Keyboard');
    expect(root.querySelector('.notifications')?.textContent).toContain(
      'Keychron K2 Keyboard added to your cart',
    );
  });

  it('removes from the cart and dismisses notifications', async () => {
    const { root, click } = await render();
    await click('Add Keychron K2 Keyboard to cart');

    await click('Remove Keychron K2 Keyboard');
    await click('Dismiss');

    expect(root.querySelector('.cart-count')?.textContent).toContain('Cart (0)');
    expect(root.querySelectorAll('.notifications li')).toHaveLength(0);
  });

  it('keeps a wishlist', async () => {
    const { root, click } = await render();

    await click('Wishlist Ducky One 3 Keyboard');
    expect(root.querySelector('.wishlist')?.textContent).toContain('Ducky One 3 Keyboard');

    await click('Wishlist Ducky One 3 Keyboard');
    expect(root.querySelectorAll('.wishlist li')).toHaveLength(0);
  });

  it('places an order: the cart empties and the order is recorded', async () => {
    const { root, click } = await render();
    await click('Add Glorious Model O to cart');

    await click('Place order');

    expect(root.querySelector('.cart-count')?.textContent).toContain('Cart (0)');
    expect(root.querySelector('.orders-count')?.textContent).toContain('Orders: 1');
    expect(root.querySelector('.notifications')?.textContent).toContain('Order #1 placed: $59.00');
  });
});

describe('L3 - shop structure (fitness functions)', () => {
  const folders = [...new Set(sources.map((s) => moduleOf(s.path)))].filter((m) => m !== 'root');

  it('is organised by feature, not by kind of file', () => {
    const byType = folders.filter((f) =>
      ['services', 'components', 'models', 'utils', 'helpers'].includes(f),
    );

    expect(byType).toEqual([]);
    expect(folders.filter((f) => f !== 'shared').sort()).toEqual([...FEATURES].sort());
  });

  it('gives every feature a public index.ts', () => {
    const missing = FEATURES.filter((f) => !sources.some((s) => s.path === `${f}/index.ts`));

    expect(missing).toEqual([]);
  });

  it('keeps files small enough to review', () => {
    const big = sources.filter((s) => s.lines > 60).map((s) => `${s.path} (${s.lines} lines)`);

    expect(big).toEqual([]);
  });

  it('crosses feature boundaries only through index.ts and without cycles', () => {
    const crossing = sources.flatMap((file) =>
      file.imports
        .filter(
          (i) =>
            i.target &&
            FEATURES.includes(moduleOf(i.target)) &&
            moduleOf(i.target) !== moduleOf(file.path),
        )
        .map((i) => ({ from: file.path, to: i.target as string })),
    );
    const deep = crossing
      .filter(({ to }) => !to.endsWith('/index.ts'))
      .map(({ from, to }) => `${from} -> ${to}`);
    const graph = new Map<string, Set<string>>();
    for (const { from, to } of crossing.filter(({ from }) => FEATURES.includes(moduleOf(from)))) {
      graph.set(moduleOf(from), (graph.get(moduleOf(from)) ?? new Set()).add(moduleOf(to)));
    }
    const cyclic = [...graph.keys()].filter((start) => {
      const seen = new Set<string>();
      const stack = [...(graph.get(start) ?? [])];
      while (stack.length) {
        const next = stack.pop()!;
        if (next === start) {
          return true;
        }
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(...(graph.get(next) ?? []));
        }
      }
      return false;
    });

    expect(deep).toEqual([]);
    expect(cyclic).toEqual([]);
    expect(FEATURES.some((f) => sources.some((s) => s.path.startsWith(`${f}/`)))).toBe(true);
  });

  it('keeps shared free of feature knowledge', () => {
    const leaks = sources
      .filter((s) => moduleOf(s.path) === 'shared')
      .flatMap((s) =>
        s.imports
          .filter((i) => i.target && FEATURES.includes(moduleOf(i.target)))
          .map((i) => `${s.path} -> ${i.target}`),
      );

    expect(leaks).toEqual([]);
  });
});
