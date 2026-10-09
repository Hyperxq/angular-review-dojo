import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertsStore } from './alerts-store';

@Component({
  selector: 'app-alerts-badge',
  template: `<span class="badge">{{ store.count() }} active</span>`,
})
export class AlertsBadge {
  protected readonly store = inject(AlertsStore);
}

@Component({
  selector: 'app-alerts-shell',
  imports: [RouterOutlet, AlertsBadge],
  template: `
    <header>
      <h2>Price alerts</h2>
      <app-alerts-badge />
    </header>
    <router-outlet />
  `,
})
export class AlertsShell {}
