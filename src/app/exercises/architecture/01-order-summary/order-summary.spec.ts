import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { PricedLine, priceOrder } from './order-pricing';
import { OrderSummary } from './order-summary';
import { OrderSummaryPage } from './order-summary-page';

const line = (unitPrice: number, quantity = 1): PricedLine => ({
  productId: 1,
  name: 'Thing',
  unitPrice,
  quantity,
});

describe('L1 - order summary', () => {
  describe('pricing rules', () => {
    it('discounts orders from $500 and adds tax on the discounted amount', () => {
      expect(priceOrder([line(500)])).toEqual({
        subtotal: 500,
        discount: 50,
        tax: 94.5,
        total: 544.5,
      });
      expect(priceOrder([line(100)])).toEqual({ subtotal: 100, discount: 0, tax: 21, total: 121 });
    });
  });

  describe('presentational component', () => {
    function render(lines: PricedLine[]) {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      const fixture = TestBed.createComponent(OrderSummary);
      fixture.componentRef.setInput('lines', lines);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('renders from its inputs alone, without making requests', () => {
      const root = render([line(100, 2)]);

      TestBed.inject(HttpTestingController).verify();
      expect(root.querySelector('.subtotal')?.textContent).toContain('$200.00');
      expect(root.querySelector('.total')?.textContent).toContain('$242.00');
    });

    it('shows the totals of the pricing rules at the discount threshold', () => {
      const root = render([line(500)]);

      expect(root.querySelector('.discount')?.textContent).toContain('$50.00');
      expect(root.querySelector('.total')?.textContent).toContain('$544.50');
    });

    it('shows no discount below the threshold', () => {
      const root = render([line(499.99)]);

      expect(root.querySelector('.discount')).toBeNull();
    });

    it('tells the page when the order is confirmed', () => {
      const confirm = vi.fn();
      const fixture = TestBed.createComponent(OrderSummary);
      fixture.componentRef.setInput('lines', [line(10)]);
      fixture.componentInstance.confirm.subscribe(confirm);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();

      expect(confirm).toHaveBeenCalledOnce();
    });
  });

  describe('page', () => {
    it('loads the order and warns about low stock', async () => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      const fixture = TestBed.createComponent(OrderSummaryPage);
      fixture.detectChanges();
      const backend = TestBed.inject(HttpTestingController);

      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve));
        fixture.detectChanges();
        backend.match('/api/products').forEach((r) => r.flush(structuredClone(SEED_PRODUCTS)));
        backend.match('/api/stock').forEach((r) => r.flush({ 1: 12, 6: 2 }));
      }
      await fixture.whenStable();
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).toContain('Keychron K2 Keyboard');
      expect([...root.querySelectorAll('.stock')].map((c) => c.textContent?.trim())).toEqual([
        '',
        'Only 2 left',
      ]);
    });
  });
});
