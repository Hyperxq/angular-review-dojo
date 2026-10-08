import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, min, required, validate } from '@angular/forms/signals';
import { CheckoutApi, CheckoutOrder } from './checkout-api';

@Component({
  selector: 'app-checkout-form',
  imports: [FormField],
  template: `
    <h2>Checkout</h2>
    <form (submit)="placeOrder($event)" novalidate>
      <label>Email <input type="email" [formField]="checkout.email" /></label>
      @for (error of checkout.email().errors(); track error.kind) {
        <p role="alert">{{ error.message }}</p>
      }

      <label>Confirm email <input type="email" [formField]="checkout.confirmEmail" /></label>
      @for (error of checkout.confirmEmail().errors(); track error.kind) {
        <p role="alert">{{ error.message }}</p>
      }

      <label>Quantity <input type="number" [formField]="checkout.quantity" /></label>
      @for (error of checkout.quantity().errors(); track error.kind) {
        <p role="alert">{{ error.message }}</p>
      }

      <label><input type="checkbox" [formField]="checkout.wantsGift" /> This is a gift</label>
      <label>Gift note <textarea [formField]="checkout.giftNote"></textarea></label>
      @for (error of checkout.giftNote().errors(); track error.kind) {
        <p role="alert">{{ error.message }}</p>
      }

      <button type="submit">Place order</button>
    </form>
    @if (orderId(); as id) {
      <p role="status">Order #{{ id }} placed</p>
    }
  `,
})
export class CheckoutForm {
  private readonly api = inject(CheckoutApi);

  protected readonly model = signal<CheckoutOrder>({
    email: 'ada@example.com',
    confirmEmail: '',
    quantity: 1,
    wantsGift: false,
    giftNote: '',
  });
  protected readonly orderId = signal<number | null>(null);

  protected readonly checkout = form(this.model, (path) => {
    const accountEmail = this.model().email;

    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email' });
    validate(path.confirmEmail, ({ value }) =>
      value() === accountEmail ? null : { kind: 'mismatch', message: 'Emails do not match' },
    );
    min(path.quantity, 1, { message: 'Order at least one unit' });
    required(path.giftNote, { message: 'Write a gift note' });
  });

  protected async placeOrder(event: Event) {
    event.preventDefault();
    const receipt = await this.api.place(this.model());
    this.orderId.set(receipt.orderId);
  }
}
