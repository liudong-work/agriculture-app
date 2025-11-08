import type { Product } from './product';

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  selected: boolean;
};

export type CartItemWithProduct = CartItem & {
  product: Product;
};

export type CartSummary = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  details: { label: string; value: number }[];
};

export type CartResult = {
  items: CartItemWithProduct[];
  summary: CartSummary;
};

