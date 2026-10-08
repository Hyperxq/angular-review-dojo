import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FeedbackForm } from './feedback-form';
import { PageLayout } from './page-layout';
import { OrdersPage, ProductsPage } from './pages';

@Component({
  selector: 'app-products-host',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PageLayout, ProductsPage],
  template: `<app-page-layout><app-products-page /></app-page-layout>`,
})
class ProductsHost {}

@Component({
  selector: 'app-orders-host',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PageLayout, OrdersPage],
  template: `<app-page-layout><app-orders-page /></app-page-layout>`,
})
class OrdersHost {}

@Component({
  selector: 'app-feedback-host',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FeedbackForm],
  template: `<app-feedback-form />`,
})
class FeedbackHost {}

describe('L2 - page header', () => {
  it('renders the page with its title and no expression-changed error', async () => {
    const fixture = TestBed.createComponent(ProductsHost);

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Products');
  });

  it('has the title in the header on the first render, without waiting for a timer', async () => {
    const fixture = TestBed.createComponent(OrdersHost);

    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')!.textContent).toBe('Orders');
    expect(el.textContent).toContain('3 open orders');
  });

  it('ties the feedback label to its text area, without an expression-changed error', async () => {
    const fixture = TestBed.createComponent(FeedbackHost);

    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const label = el.querySelector('label')!;
    expect(label.htmlFor).not.toBe('');
    expect(label.htmlFor).toBe(el.querySelector('textarea')!.id);
  });

  it('gives each feedback form its own id', async () => {
    const first = TestBed.createComponent(FeedbackHost);
    const second = TestBed.createComponent(FeedbackHost);
    await Promise.allSettled([first.whenStable(), second.whenStable()]);

    const id = (f: typeof first) => (f.nativeElement as HTMLElement).querySelector('textarea')!.id;
    expect(id(first)).not.toBe(id(second));
  });
});
