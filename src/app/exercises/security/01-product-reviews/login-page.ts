import { Component, inject, input } from '@angular/core';
import { HARD_REDIRECT } from './hard-redirect';
import { safeReturnUrl } from './return-url';

@Component({
  selector: 'app-login-page',
  template: `
    <form (submit)="signIn($event)">
      <label>Email <input type="email" name="email" /></label>
      <button type="submit">Sign in</button>
    </form>
  `,
})
export class LoginPage {
  private readonly redirect = inject(HARD_REDIRECT);

  readonly returnUrl = input<string>();

  protected signIn(event: Event) {
    event.preventDefault();
    this.redirect(safeReturnUrl(this.returnUrl()));
  }
}
