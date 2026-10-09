export interface PriceAlert {
  id: number;
  productId: number;
  productName: string;
  targetPrice: number;
  note: string;
  createdAt: string;
}

export type NewAlert = Omit<PriceAlert, 'id' | 'createdAt'>;
