import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from './session';

@Component({
  selector: 'app-area-home',
  template: `<h2>Welcome back</h2>`,
})
export class HomePage {}

@Component({
  selector: 'app-area-login',
  template: `
    <h2>Sign in</h2>
    <button type="button" (click)="signIn('admin')">Sign in as admin</button>
    <button type="button" (click)="signIn('customer')">Sign in as customer</button>
  `,
})
export class LoginPage {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  protected signIn(role: 'admin' | 'customer') {
    this.session.signIn({ name: role === 'admin' ? 'Ada' : 'Sam', role });
    this.router.navigateByUrl(this.returnUrl() ?? '/home');
  }
}

@Component({
  selector: 'app-area-forbidden',
  template: `<h2>You do not have access to this area</h2>`,
})
export class ForbiddenPage {}

@Component({
  selector: 'app-area-reports',
  template: `<h2>Sales reports</h2>`,
})
export class ReportsPage {}
