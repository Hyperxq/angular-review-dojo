import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a [routerLink]="['account', 7]">Customer 7</a>
      <a [routerLink]="['account', 9]">Customer 9</a>
    </nav>
    <router-outlet />
  `,
})
export class AccountShell {}
