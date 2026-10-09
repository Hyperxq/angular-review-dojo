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
        (input)="email.set($any($event.target).value)"
      />
      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
      <button type="submit">Subscribe</button>
    </form>
    @if (done()) {
      <p class="done">Thanks, check your inbox to confirm.</p>
    }
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
