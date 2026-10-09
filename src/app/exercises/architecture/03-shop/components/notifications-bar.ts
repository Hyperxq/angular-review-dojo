import { Component, inject } from '@angular/core';
import { ShopService } from '../services/shop.service';

@Component({
  selector: 'app-notifications-bar',
  template: `
    <ul class="notifications" role="status">
      @for (n of shop.notifications(); track n.id) {
        <li>
          {{ n.message }}
          <button type="button" (click)="shop.dismiss(n.id)">Dismiss</button>
        </li>
      }
    </ul>
  `,
})
export class NotificationsBar {
  protected readonly shop = inject(ShopService);
}
