import { randomUUID } from 'crypto';

import type { CartItem } from '../types/cart';

const carts = new Map<string, CartItem[]>();

export class CartRepository {
  async getCartByUser(userId: string): Promise<CartItem[]> {
    return carts.get(userId) ?? [];
  }

  async saveCart(userId: string, items: CartItem[]): Promise<void> {
    carts.set(userId, items);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const cart = await this.getCartByUser(userId);
    const existing = cart.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
      await this.saveCart(userId, cart);
      return existing;
    }

    const newItem: CartItem = {
      id: randomUUID(),
      productId,
      quantity,
      selected: true,
    };

    cart.push(newItem);
    await this.saveCart(userId, cart);
    return newItem;
  }

  async updateItem(userId: string, itemId: string, payload: Partial<CartItem>): Promise<CartItem> {
    const cart = await this.getCartByUser(userId);
    const item = cart.find((entry) => entry.id === itemId);
    if (!item) {
      const error = new Error('购物车商品不存在');
      (error as any).status = 404;
      throw error;
    }

    if (payload.quantity !== undefined) {
      item.quantity = Math.max(1, payload.quantity);
    }

    if (payload.selected !== undefined) {
      item.selected = payload.selected;
    }

    await this.saveCart(userId, cart);
    return item;
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const cart = await this.getCartByUser(userId);
    const next = cart.filter((item) => item.id !== itemId);
    await this.saveCart(userId, next);
  }

  async setSelectAll(userId: string, selected: boolean): Promise<void> {
    const cart = await this.getCartByUser(userId);
    cart.forEach((item) => {
      item.selected = selected;
    });
    await this.saveCart(userId, cart);
  }
}

