import { apiClient } from './apiClient';

export type CartProduct = {
  id: string;
  name: string;
  origin: string;
  price: number;
  originalPrice?: number;
  unit: string;
  images: string[];
  seasonalTag?: string;
  isOrganic?: boolean;
  stock: number;
};

export type CartItemResponse = {
  id: string;
  quantity: number;
  selected: boolean;
  productId: string;
  product: CartProduct;
};

export type CartSummary = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  details: { label: string; value: number }[];
};

type CartResponse = {
  success: boolean;
  data: {
    items: CartItemResponse[];
    summary: CartSummary;
  };
};

export async function fetchCart() {
  const response = await apiClient.get<CartResponse>('/cart');
  return response.data.data;
}

export async function addToCart(productId: string, quantity = 1) {
  await apiClient.post('/cart', { productId, quantity });
}

export async function updateCartItem(itemId: string, payload: { quantity?: number; selected?: boolean }) {
  await apiClient.patch(`/cart/${itemId}`, payload);
}

export async function removeCartItem(itemId: string) {
  await apiClient.delete(`/cart/${itemId}`);
}

export async function setCartSelectAll(selected: boolean) {
  await apiClient.post('/cart/select-all', { selected });
}

