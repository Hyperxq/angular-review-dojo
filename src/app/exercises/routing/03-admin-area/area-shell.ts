import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-area-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a [routerLink]="['home']">Home</a>
      <a [routerLink]="['admin']">Admin</a>
      <a [routerLink]="['reports']">Reports</a>
    </nav>
    <router-outlet />
  `,
})
export class AreaShell {}
