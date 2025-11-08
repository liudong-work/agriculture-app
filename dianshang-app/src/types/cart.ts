import type { CartProduct } from '../services/cart.api';

export type CartItem = {
  id: string;
  product: CartProduct;
  quantity: number;
  selected: boolean;
};

export type CartFeeDetail = {
  label: string;
  value: number;
};

export type CartSummary = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  details: CartFeeDetail[];
};

export type CartResponse = {
  items: CartItem[];
  summary: CartSummary;
};

