export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface StockChange {
  productId: number;
  stock: number;
}

export interface OrderLine {
  productId: number;
  quantity: number;
}

export interface Order {
  lines: OrderLine[];
}

export interface OrderReceipt {
  orderId: number;
  total: number;
}
