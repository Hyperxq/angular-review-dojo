import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { ProductApi } from '../../../core/product-api';
import { CategoryList, FeaturedList } from './lists';
import { PriceEditor } from './price-editor';
import { StockSummary } from './stock-summary';
import { TextFit } from './text-fit';

describe('L3 - list widgets', () => {
  const api = { byCategory: vi.fn(), list: vi.fn(), stock: vi.fn() };

  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
  });

  describe('CategoryList', () => {
    it('loads the category it is given and lists it', async () => {
      api.byCategory.mockReturnValue(of(SEED_PRODUCTS.filter((p) => p.category === 'mice')));
      const fixture = TestBed.createComponent(CategoryList);
      fixture.componentRef.setInput('category', 'mice');

      await fixture.whenStable();

      expect(api.byCategory).toHaveBeenCalledWith('mice');
      expect([...fixture.nativeElement.querySelectorAll('li')].map((li: HTMLElement) => li.textContent)).toEqual([
        'Logitech MX Master 3S',
        'Razer DeathAdder V3',
        'Glorious Model O',
      ]);
      expect(fixture.nativeElement.textContent).not.toContain('Loading');
    });

    it('reloads when the category changes', async () => {
      api.byCategory.mockImplementation((category: string) => of(SEED_PRODUCTS.filter((p) => p.category === category)));
      const fixture = TestBed.createComponent(CategoryList);
      fixture.componentRef.setInput('category', 'mice');
      await fixture.whenStable();

      fixture.componentRef.setInput('category', 'audio');
      await fixture.whenStable();

      expect(api.byCategory).toHaveBeenLastCalledWith('audio');
      expect(fixture.nativeElement.textContent).toContain('Sony WH-1000XM5 Headset');
    });

    it('shows an error when the request fails', async () => {
      api.byCategory.mockReturnValue(throwError(() => new Error('boom')));
      const fixture = TestBed.createComponent(CategoryList);
      fixture.componentRef.setInput('category', 'mice');

      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Loading');
    });
  });

  describe('FeaturedList', () => {
    it('stops listening to its request when destroyed', async () => {
      const request = new Subject<unknown[]>();
      api.list.mockReturnValue(request);
      const fixture = TestBed.createComponent(FeaturedList);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve));
      expect(request.observed).toBe(true);

      fixture.destroy();

      expect(request.observed).toBe(false);
    });
  });

  describe('StockSummary', () => {
    it('summarises the stock once it has loaded', async () => {
      api.stock.mockReturnValue(of({ 1: 12, 2: 5, 3: 0, 4: 20 }));
      const fixture = TestBed.createComponent(StockSummary);

      await fixture.whenStable();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid=total]')!.textContent).toBe('37 units in stock');
      expect(el.querySelector('[data-testid=sold-out]')!.textContent).toBe('1 sold out');
    });

    it('shows a message instead of crashing when the stock request fails', async () => {
      api.stock.mockReturnValue(throwError(() => new Error('boom')));
      const fixture = TestBed.createComponent(StockSummary);

      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    });
  });

  describe('PriceEditor', () => {
    it('has the new price as its draft as soon as the input is set', () => {
      const fixture = TestBed.createComponent(PriceEditor);

      fixture.componentRef.setInput('price', 5);
      expect(fixture.componentInstance.draft()).toBe(5);

      fixture.componentRef.setInput('price', 8);
      expect(fixture.componentInstance.draft()).toBe(8);
    });

    it('keeps what the user typed until the price changes', async () => {
      const fixture = TestBed.createComponent(PriceEditor);
      fixture.componentRef.setInput('price', 5);
      await fixture.whenStable();
      const emitted: number[] = [];
      fixture.componentInstance.saved.subscribe((v) => emitted.push(v));
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

      input.value = '7';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      fixture.nativeElement.querySelector('button').click();

      expect(emitted).toEqual([7]);
    });
  });

  describe('TextFit', () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return (this.textContent?.length ?? 0) * 10;
      });
    });

    afterEach(() => vi.restoreAllMocks());

    it('measures the label and measures again when it changes', async () => {
      const fixture = TestBed.createComponent(TextFit);
      fixture.componentRef.setInput('label', 'abc');
      await fixture.whenStable();
      const width = () => fixture.nativeElement.querySelector('[data-testid=width]').textContent;
      expect(width()).toBe('30px');

      fixture.componentRef.setInput('label', 'abcdef');
      await fixture.whenStable();

      expect(width()).toBe('60px');
    });
  });
});
