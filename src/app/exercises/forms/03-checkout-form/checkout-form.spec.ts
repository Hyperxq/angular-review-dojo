import { TestBed } from '@angular/core/testing';
import { CheckoutApi } from './checkout-api';
import { CheckoutForm } from './checkout-form';

describe('L3 - CheckoutForm (Signal Forms)', () => {
  const api = { place: vi.fn() };

  beforeEach(() => {
    api.place.mockReset();
    api.place.mockResolvedValue({ orderId: 42 });
    TestBed.configureTestingModule({ providers: [{ provide: CheckoutApi, useValue: api }] });
  });

  const setup = async () => {
    const fixture = TestBed.createComponent(CheckoutForm);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const field = (label: string) =>
      [...el.querySelectorAll('label')].find((l) => l.textContent?.includes(label))!.querySelector(
        'input, textarea',
      ) as HTMLInputElement;
    const type = async (label: string, value: string) => {
      const control = field(label);
      control.value = value;
      control.dispatchEvent(new Event('input'));
      control.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    const alerts = () => [...el.querySelectorAll('[role=alert]')].map((a) => a.textContent?.trim());
    const submit = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    };
    return { fixture, el, field, type, alerts, submit };
  };

  it('starts clean: no messages before the customer does anything', async () => {
    const { alerts } = await setup();

    expect(alerts()).toEqual([]);
  });

  it('flags a confirmation that differs from the email', async () => {
    const { type, alerts } = await setup();

    await type('Confirm email', 'someone@else.com');

    expect(alerts()).toEqual(['Emails do not match']);
  });

  it('compares the confirmation with the current email, not the one it started with', async () => {
    const { type, alerts } = await setup();

    await type('Email', 'grace@example.com');
    await type('Confirm email', 'grace@example.com');

    expect(alerts()).toEqual([]);
  });

  it('asks for a gift note only on gifts', async () => {
    const { fixture, el, field } = await setup();
    expect(el.querySelector('textarea')).toBeNull();

    field('This is a gift').click();
    await fixture.whenStable();

    expect(el.querySelector('textarea')).not.toBeNull();
  });

  it('does not place an invalid order and shows what is wrong', async () => {
    const { type, alerts, submit } = await setup();
    await type('Confirm email', 'someone@else.com');
    await type('Quantity', '0');

    await submit();

    expect(api.place).not.toHaveBeenCalled();
    expect(alerts()).toEqual(['Emails do not match', 'Order at least one unit']);
  });

  it('shows the errors of untouched fields when the customer presses "Place order"', async () => {
    const { alerts, submit } = await setup();

    await submit();

    expect(api.place).not.toHaveBeenCalled();
    expect(alerts()).toEqual(['Emails do not match']);
  });

  it('requires the note when the order is a gift', async () => {
    const { fixture, field, type, alerts, submit } = await setup();
    await type('Confirm email', 'ada@example.com');
    field('This is a gift').click();
    await fixture.whenStable();

    await submit();

    expect(api.place).not.toHaveBeenCalled();
    expect(alerts()).toEqual(['Write a gift note']);

    await type('Gift note', 'Happy birthday!');
    await submit();
    expect(api.place).toHaveBeenCalledTimes(1);
  });

  it('places a valid order that is not a gift', async () => {
    const { el, type, submit } = await setup();
    await type('Confirm email', 'ada@example.com');

    await submit();

    expect(api.place).toHaveBeenCalledWith({
      email: 'ada@example.com',
      confirmEmail: 'ada@example.com',
      quantity: 1,
      wantsGift: false,
      giftNote: '',
    });
    expect(el.querySelector('[role=status]')?.textContent).toContain('Order #42 placed');
  });
});
