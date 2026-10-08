import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { OrderForm, OrderPayload } from './order-form';
import { QuantityStepper } from './quantity-stepper';
import { SkuApi } from './sku-api';

@Component({
  imports: [ReactiveFormsModule, QuantityStepper],
  template: `<app-quantity-stepper [formControl]="control" />`,
})
class StepperHost {
  readonly control = new FormControl(2, { nonNullable: true });
}

describe('L2 - QuantityStepper', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(StepperHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, control: fixture.componentInstance.control, buttons: el.querySelectorAll('button') };
  };

  it('shows the value of the control', async () => {
    const { el, control, fixture } = await setup();
    expect(el.querySelector('output')!.textContent).toBe('2');

    control.setValue(7);
    await fixture.whenStable();
    expect(el.querySelector('output')!.textContent).toBe('7');
  });

  it('writes the new quantity to the control when stepping', async () => {
    const { control, buttons } = await setup();

    buttons[1].click();
    buttons[1].click();
    buttons[0].click();

    expect(control.value).toBe(3);
  });

  it('never goes below 1', async () => {
    const { control, buttons } = await setup();

    buttons[0].click();
    buttons[0].click();

    expect(control.value).toBe(1);
  });

  it('marks the control as touched when the user leaves it', async () => {
    const { control, buttons } = await setup();

    buttons[1].dispatchEvent(new FocusEvent('blur'));

    expect(control.touched).toBe(true);
  });

  it('is disabled together with its control', async () => {
    const { fixture, control, buttons } = await setup();

    control.disable();
    await fixture.whenStable();

    expect([...buttons].every((b) => b.disabled)).toBe(true);
  });
});

describe('L2 - OrderForm', () => {
  const api = { isAvailable: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    api.isAvailable.mockReset();
    api.isAvailable.mockReturnValue(of(true));
    TestBed.configureTestingModule({ providers: [{ provide: SkuApi, useValue: api }] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () => {
    const fixture = TestBed.createComponent(OrderForm);
    const placed: OrderPayload[] = [];
    fixture.componentInstance.submitted.subscribe((o) => placed.push(o));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const typeSku = (index: number, value: string) => {
      const input = el.querySelectorAll<HTMLInputElement>('input[formControlName=sku]')[index];
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const placeOrder = () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    };
    return { fixture, el, form: fixture.componentInstance.form, typeSku, placeOrder, placed };
  };

  it('places an order with the typed lines', async () => {
    const { form, typeSku, placeOrder, placed } = setup();
    typeSku(0, 'KB-100');
    form.controls.lines.at(0).controls.quantity.setValue(4);
    await vi.advanceTimersByTimeAsync(1000);

    placeOrder();

    expect(placed).toEqual([{ lines: [{ sku: 'KB-100', quantity: 4 }] }]);
  });

  it('asks about availability once the user pauses typing, not on every keystroke', async () => {
    const { typeSku } = setup();

    typeSku(0, 'K');
    await vi.advanceTimersByTimeAsync(100);
    typeSku(0, 'KB');
    await vi.advanceTimersByTimeAsync(100);
    typeSku(0, 'KB-1');
    await vi.advanceTimersByTimeAsync(1000);

    expect(api.isAvailable).toHaveBeenCalledTimes(1);
    expect(api.isAvailable).toHaveBeenCalledWith('KB-1');
  });

  it('does not place the order while the availability check is running', async () => {
    const answer = new Subject<boolean>();
    api.isAvailable.mockReturnValue(answer);
    const { typeSku, placeOrder, placed } = setup();
    typeSku(0, 'KB-100');
    await vi.advanceTimersByTimeAsync(1000);

    placeOrder();
    expect(placed).toEqual([]);

    answer.next(true);
    answer.complete();
    placeOrder();
    expect(placed).toHaveLength(1);
  });

  it('flags an unavailable SKU and blocks the order', async () => {
    api.isAvailable.mockReturnValue(of(false));
    const { fixture, el, typeSku, placeOrder, placed } = setup();
    typeSku(0, 'SOLD-1');
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();

    placeOrder();

    expect(el.querySelector('[role=alert]')?.textContent).toContain('not available');
    expect(placed).toEqual([]);
  });

  it('applies the 10-unit limit to the whole order, not to each line', async () => {
    const { fixture, el, form, typeSku, placeOrder, placed } = setup();
    [...el.querySelectorAll('button')].find((b) => b.textContent === 'Add line')!.click();
    fixture.detectChanges();
    typeSku(0, 'KB-100');
    typeSku(1, 'MS-200');
    form.controls.lines.at(0).controls.quantity.setValue(6);
    form.controls.lines.at(1).controls.quantity.setValue(6);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();

    placeOrder();

    expect(placed).toEqual([]);
    expect(el.querySelector('[role=alert]')?.textContent).toContain('at most 10 units');
  });

  it('accepts an order of exactly 10 units over several lines', async () => {
    const { fixture, el, form, typeSku, placeOrder, placed } = setup();
    [...el.querySelectorAll('button')].find((b) => b.textContent === 'Add line')!.click();
    fixture.detectChanges();
    typeSku(0, 'KB-100');
    typeSku(1, 'MS-200');
    form.controls.lines.at(0).controls.quantity.setValue(6);
    form.controls.lines.at(1).controls.quantity.setValue(4);
    await vi.advanceTimersByTimeAsync(1000);

    placeOrder();

    expect(placed).toHaveLength(1);
  });
});
