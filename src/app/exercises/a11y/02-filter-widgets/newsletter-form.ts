import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-newsletter-form',
  template: `
    <form (submit)="submit($event)" novalidate>
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        [value]="email()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? 'email-error' : null"
        (input)="email.set($any($event.target).value)"
      />
      @if (error()) {
        <p id="email-error" class="error" role="alert">{{ error() }}</p>
      }
      <button type="submit">Subscribe</button>
    </form>
    <div role="status">
      @if (done()) {
        <p class="done">Thanks, check your inbox to confirm.</p>
      }
    </div>
  `,
})
export class NewsletterForm {
  protected readonly email = signal('');
  protected readonly error = signal('');
  protected readonly done = signal(false);

  protected submit(event: Event) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(this.email())) {
      this.error.set('Enter a valid email address.');
      this.done.set(false);
      return;
    }
    this.error.set('');
    this.done.set(true);
  }
}
