import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { StockFeed } from '../../../core/stock-feed';
import { ProductBrowser } from './product-browser';

const inCategory = (id: string) => SEED_PRODUCTS.filter((p) => p.category === id);

describe('L6 - ProductBrowser', () => {
  const api = { byCategory: vi.fn() };
  let fixture: ComponentFixture<ProductBrowser>;
  const el = () => fixture.nativeElement as HTMLElement;
  const click = (selector: string) => el().querySelector<HTMLButtonElement>(selector)!.click();
  const listed = () => [...el().querySelectorAll('.products li')].map((li) => li.textContent);

  // whenStable() would wait for requests that are deliberately left pending.
  async function settle() {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function open(category: string) {
    fixture = TestBed.createComponent(ProductBrowser);
    fixture.componentRef.setInput('category', category);
    await settle();
  }

  beforeEach(() => {
    api.byCategory.mockReset();
    api.byCategory.mockImplementation((id: string) => of(inCategory(id)));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    TestBed.configureTestingModule({
      rethrowApplicationErrors: false,
      providers: [{ provide: ProductApi, useValue: api }],
    });
  });

  it('lists the products of the category', async () => {
    await open('mice');

    expect(listed()).toEqual(inCategory('mice').map((p) => p.name));
  });

  it('shows the latest category even if an older request answers last', async () => {
    const responses: Record<string, Subject<Product[]>> = {
      keyboards: new Subject(),
      mice: new Subject(),
    };
    api.byCategory.mockImplementation((id: string) => responses[id]);

    await open('keyboards');
    fixture.componentRef.setInput('category', 'mice');
    await settle();
    responses['mice'].next(inCategory('mice'));
    responses['keyboards'].next(inCategory('keyboards'));
    await settle();

    expect(listed()).toEqual(inCategory('mice').map((p) => p.name));
  });

  it('compares prices from cheapest to most expensive on demand', async () => {
    await open('mice');

    click('#compare');
    await settle();

    const rows = [...el().querySelectorAll('tr td:first-child')].map((td) => td.textContent);
    expect(rows).toEqual(['Glorious Model O', 'Razer DeathAdder V3', 'Logitech MX Master 3S']);
  });

  it('announces restocks after the user opts in, and only restocks', async () => {
    await open('mice');
    const feed = TestBed.inject(StockFeed);

    click('#notify');
    await settle();
    feed.changes$.next({ productId: 3, stock: 0 });
    feed.changes$.next({ productId: 3, stock: 5 });
    await settle();

    const alerts = [...el().querySelectorAll('[role=status]')].map((p) => p.textContent);
    expect(alerts).toEqual(['Product #3 is back in stock (5 left)']);
  });

  it('stops listening to the feed when destroyed', async () => {
    await open('mice');
    click('#notify');
    await settle();

    fixture.destroy();

    expect(TestBed.inject(StockFeed).changes$.observed).toBe(false);
  });
});
