import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { getByRole } from '../../../core/a11y-queries';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { ProductAdmin } from './product-admin';
import { ProductStore } from './product-store';

const CATALOG = SEED_PRODUCTS.slice(0, 4);
const EXTRA: Product = { id: 99, name: 'Zowie EC2', price: 79, category: 'mice', stock: 3 };

describe('L2 - product store', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return TestBed.inject(ProductStore);
  }

  function load(store: InstanceType<typeof ProductStore>) {
    store.load();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/products')
      .flush(structuredClone(CATALOG));
  }

  describe('store', () => {
    it('loads the products', () => {
      const store = setup();

      load(store);

      expect(store.loading()).toBe(false);
      expect(store.count()).toBe(4);
    });

    it('updates derived values as soon as a product is added', () => {
      const store = setup();
      load(store);
      expect(store.count()).toBe(4);

      store.add(EXTRA);

      expect(store.count()).toBe(5);
      expect(store.visible().map((p) => p.id)).toContain(99);
    });

    it('applies the filter immediately', () => {
      const store = setup();
      load(store);

      store.setFilter('keyboard');

      expect(store.visible().map((p) => p.id)).toEqual([1, 2, 3]);
    });

    it('shows the new price in the selection after an update', () => {
      const store = setup();
      load(store);
      store.select(4);

      store.updatePrice(4, 79);

      expect(store.selected()?.price).toBe(79);
      expect(store.visible()[3].price).toBe(79);
      expect(store.inventoryValue()).toBe(
        CATALOG.reduce((sum, p) => sum + (p.id === 4 ? 79 : p.price) * p.stock, 0),
      );
    });

    it('clears the selection when the selected product is removed', () => {
      const store = setup();
      load(store);
      store.select(1);

      store.remove(1);

      expect(store.selected()).toBeNull();
      expect(store.count()).toBe(3);
    });

    it('keeps the selection when another product is removed', () => {
      const store = setup();
      load(store);
      store.select(1);

      store.remove(2);

      expect(store.selected()?.id).toBe(1);
    });
  });

  describe('admin page', () => {
    it('shows the same price in the list and in the detail panel after saving', async () => {
      const store = setup();
      const fixture = TestBed.createComponent(ProductAdmin);
      fixture.detectChanges();
      TestBed.inject(HttpTestingController)
        .expectOne('/api/products')
        .flush(structuredClone(CATALOG));
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;

      getByRole(root, 'button', { name: 'Logitech MX Master 3S' }).click();
      await fixture.whenStable();
      const input = root.querySelector<HTMLInputElement>('.detail input')!;
      input.value = '79';
      root.querySelector<HTMLButtonElement>('.save')!.click();
      await fixture.whenStable();

      expect(root.querySelectorAll('.price')[3].textContent).toContain('$79.00');
      expect(root.querySelector<HTMLInputElement>('.detail input')!.value).toBe('79');
      expect(store.selected()?.price).toBe(79);
    });

    it('hides the detail panel when its product is deleted', async () => {
      setup();
      const fixture = TestBed.createComponent(ProductAdmin);
      fixture.detectChanges();
      TestBed.inject(HttpTestingController)
        .expectOne('/api/products')
        .flush(structuredClone(CATALOG));
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;

      getByRole(root, 'button', { name: 'Keychron K2 Keyboard' }).click();
      await fixture.whenStable();
      root.querySelector<HTMLButtonElement>('.drop')!.click();
      await fixture.whenStable();

      expect(root.querySelector('.detail')).toBeNull();
    });
  });
});
