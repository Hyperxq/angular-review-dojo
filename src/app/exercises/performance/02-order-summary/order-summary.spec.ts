import { TestBed } from '@angular/core/testing';
import { OrderMath } from './order-math';
import { OrderPage } from './order-page';
import { OrderSummary } from './order-summary';

const lines = [
  { productId: 1, name: 'Keychron K2 Keyboard', price: 100, quantity: 2 },
  { productId: 2, name: 'Ducky One 3 Keyboard', price: 50, quantity: 1 },
];

describe('L2 - order summary', () => {
  describe('OrderSummary', () => {
    it('shows the totals of the order', async () => {
      const fixture = TestBed.createComponent(OrderSummary);
      fixture.componentRef.setInput('order', { lines });
      await fixture.whenStable();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('3 items');
      expect(el.querySelector('[data-testid=subtotal]')!.textContent).toContain('$250.00');
      expect(el.querySelector('[data-testid=tax]')!.textContent).toContain('$50.00');
      expect(el.querySelector('[data-testid=total]')!.textContent).toContain('$300.00');
    });

    it('is up to date after a single change detection pass', () => {
      const fixture = TestBed.createComponent(OrderSummary);
      fixture.componentRef.setInput('order', { lines });
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 items');
    });

    it('calculates the subtotal once per order', async () => {
      const subtotal = vi.spyOn(TestBed.inject(OrderMath), 'subtotal');
      const fixture = TestBed.createComponent(OrderSummary);
      fixture.componentRef.setInput('order', { lines });
      await fixture.whenStable();

      expect(subtotal).toHaveBeenCalledTimes(1);
    });
  });

  describe('OrderPage', () => {
    it('keeps the summary in step with the lines', async () => {
      const fixture = TestBed.createComponent(OrderPage);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const add = el.querySelector('button')!;

      add.click();
      await fixture.whenStable();
      add.click();
      await fixture.whenStable();

      expect(el.querySelectorAll('li')).toHaveLength(2);
      expect(el.textContent).toContain('2 items');
      expect(el.querySelector('[data-testid=subtotal]')!.textContent).toContain('$208.00');
    });
  });
});
