import { Component, inject } from '@angular/core';
import { NotificationsStore } from './notifications-store';

@Component({
  selector: 'app-notifications-bar',
  template: `
    <ul class="notifications" role="status">
      @for (n of store.items(); track n.id) {
        <li>
          {{ n.message }}
          <button type="button" (click)="store.dismiss(n.id)">Dismiss</button>
        </li>
      }
    </ul>
  `,
})
export class NotificationsBar {
  protected readonly store = inject(NotificationsStore);
}
