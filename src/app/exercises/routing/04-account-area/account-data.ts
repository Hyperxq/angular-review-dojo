import { Injectable, signal } from '@angular/core';

export interface AccountOrder {
  id: number;
  customerId: string;
  item: string;
  total: number;
}

export const ACCOUNT_ORDERS: readonly AccountOrder[] = [
  { id: 1, customerId: '7', item: 'Keychron K2 Keyboard', total: 89 },
  { id: 2, customerId: '7', item: 'Glorious Model O', total: 59 },
  { id: 3, customerId: '7', item: 'Dell U2723QE 27" Monitor', total: 549 },
  { id: 4, customerId: '9', item: 'Sony WH-1000XM5 Headset', total: 349 },
];

@Injectable({ providedIn: 'root' })
export class AccountSession {
  private readonly active = signal(true);
  readonly signedIn = this.active.asReadonly();

  signOut() {
    this.active.set(false);
  }
}
