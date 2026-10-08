import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../../../core/fake-backend';
import { Category, Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { ProductDetail } from './product-detail';

const byId = (id: number) => SEED_PRODUCTS.find((p) => p.id === id)!;
const categoryOf = (id: string) => SEED_CATEGORIES.find((c) => c.id === id)!;
const inCategory = (id: string) => SEED_PRODUCTS.filter((p) => p.category === id);

describe('L2 - ProductDetail', () => {
  const api = { get: vi.fn(), getCategory: vi.fn(), byCategory: vi.fn() };

  // whenStable() would wait for requests that are deliberately left pending.
  async function settle(fixture: ComponentFixture<ProductDetail>) {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function open(id: number) {
    const fixture = TestBed.createComponent(ProductDetail);
    fixture.componentRef.setInput('id', String(id));
    await settle(fixture);
    return fixture;
  }

  const text = (fixture: { nativeElement: HTMLElement }) => fixture.nativeElement.textContent ?? '';

  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getCategory.mockImplementation((id: string) => of(categoryOf(id)));
    api.byCategory.mockImplementation((id: string) => of(inCategory(id)));
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
  });

  it('shows the product, its category and the other products of that category', async () => {
    api.get.mockReturnValue(of(byId(4)));

    const fixture = await open(4);

    expect(fixture.nativeElement.querySelector('h2').textContent).toBe(byId(4).name);
    expect(text(fixture)).toContain('Mice');
    const related = [...fixture.nativeElement.querySelectorAll('li')].map((li) => li.textContent);
    expect(related).toEqual([byId(5).name, byId(6).name]);
  });

  it('ends up showing the product that was requested last, whatever the response order', async () => {
    const responses: Record<number, Subject<Product>> = { 1: new Subject(), 4: new Subject() };
    api.get.mockImplementation((id: number) => responses[id]);

    const fixture = await open(1);
    fixture.componentRef.setInput('id', '4');
    await settle(fixture);

    responses[4].next(byId(4));
    responses[1].next(byId(1));
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('h2').textContent).toBe(byId(4).name);
    expect(text(fixture)).toContain('Mice');
  });

  it('does not let a late related-products response replace the newer one', async () => {
    const lateRelated = new Subject<Product[]>();
    api.get.mockImplementation((id: number) => of(byId(id)));
    api.byCategory.mockImplementation((id: string) =>
      id === 'keyboards' ? lateRelated : of(inCategory(id)),
    );

    const fixture = await open(1);
    fixture.componentRef.setInput('id', '4');
    await settle(fixture);
    lateRelated.next(inCategory('keyboards'));
    await settle(fixture);

    const related = [...fixture.nativeElement.querySelectorAll('li')].map((li) => li.textContent);
    expect(related).toEqual([byId(5).name, byId(6).name]);
  });
});
