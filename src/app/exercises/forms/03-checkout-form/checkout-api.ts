import { Injectable } from '@angular/core';

export interface CheckoutOrder {
  email: string;
  confirmEmail: string;
  quantity: number;
  wantsGift: boolean;
  giftNote: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  async place(order: CheckoutOrder): Promise<{ orderId: number }> {
    console.debug('placing order', order);
    return { orderId: 1 };
  }
}
