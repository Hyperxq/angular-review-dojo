export type OrderStatus = 'shipped' | 'processing' | 'cancelled';

export interface TrackedOrder {
  id: number;
  status: OrderStatus;
}

export const ORDERS: readonly TrackedOrder[] = [
  { id: 1001, status: 'shipped' },
  { id: 1002, status: 'processing' },
  { id: 1003, status: 'cancelled' },
  { id: 1004, status: 'shipped' },
];
