import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { VariantPicker } from './variant-picker';

const [keyboard, , , mouse] = SEED_PRODUCTS;

describe('S2 - VariantPicker', () => {
  let fixture: ComponentFixture<VariantPicker>;
  const host = () => fixture.nativeElement as HTMLElement;
  const selected = () => host().querySelector('[aria-pressed=true]')?.getAttribute('data-variant');
  const price = () => host().querySelector('#price')!.textContent;

  async function show(product: Product) {
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
  }

  async function choose(variant: string) {
    host().querySelector<HTMLButtonElement>(`[data-variant=${variant}]`)!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(VariantPicker);
    await show(keyboard);
  });

  it('starts with the standard variant at the base price', () => {
    expect(selected()).toBe('standard');
    expect(price()).toContain('$89.00');
  });

  it('prices the selected variant', async () => {
    await choose('limited');

    expect(selected()).toBe('limited');
    expect(price()).toContain('$109.00');
  });

  it('goes back to the standard variant when another product is shown', async () => {
    await choose('limited');

    await show(mouse);

    expect(host().querySelector('h2')!.textContent).toBe(mouse.name);
    expect(selected()).toBe('standard');
    expect(price()).toContain('$99.00');
  });

  it('keeps the selection when the same product is refreshed', async () => {
    await choose('bundle');

    await show({ ...keyboard, stock: keyboard.stock - 1 });

    expect(selected()).toBe('bundle');
  });
});
