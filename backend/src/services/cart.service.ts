import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import type { CartResult, CartSummary } from '../types/cart';

const cartRepository = new CartRepository();
const productRepository = new ProductRepository();

export function calculateCartSummary(items: CartResult['items']): CartSummary {
  const selectedItems = items.filter((item) => item.selected);
  const subtotal = selectedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = subtotal >= 200 ? 20 : 0;
  const deliveryFee = selectedItems.length > 0 ? 8 : 0;
  const total = subtotal - discount + deliveryFee;

  return {
    subtotal,
    discount,
    deliveryFee,
    total,
    details: [
      { label: '商品小计', value: subtotal },
      { label: '优惠减免', value: -discount },
      { label: '冷链配送', value: deliveryFee },
    ],
  };
}

export class CartService {
  async getCart(userId: string): Promise<CartResult> {
    const items = await cartRepository.getCartByUser(userId);

    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await productRepository.findById(item.productId);
        if (!product) {
          return null;
        }
        return {
          ...item,
          product,
        };
      }),
    );

    const validItems = enriched.filter(Boolean) as CartResult['items'];

    const summary = calculateCartSummary(validItems);

    return { items: validItems, summary };
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await productRepository.findById(productId);
    if (!product) {
      const error = new Error('商品不存在');
      (error as any).status = 404;
      throw error;
    }

    if (product.stock <= 0) {
      const error = new Error('商品库存不足');
      (error as any).status = 400;
      throw error;
    }

    const cartItems = await cartRepository.getCartByUser(userId);
    const existing = cartItems.find((item) => item.productId === productId);
    const incomingQuantity = Math.max(1, quantity);
    const finalQuantity = (existing?.quantity ?? 0) + incomingQuantity;

    if (finalQuantity > product.stock) {
      const error = new Error(`库存不足，当前仅剩 ${product.stock} 件`);
      (error as any).status = 400;
      throw error;
    }

    await cartRepository.addItem(userId, productId, incomingQuantity);
  }

  async updateItem(userId: string, itemId: string, payload: { quantity?: number; selected?: boolean }) {
    const cartItems = await cartRepository.getCartByUser(userId);
    const targetItem = cartItems.find((entry) => entry.id === itemId);
    if (!targetItem) {
      const error = new Error('购物车商品不存在');
      (error as any).status = 404;
      throw error;
    }

    const normalizedPayload: { quantity?: number; selected?: boolean } = { ...payload };

    if (payload.quantity !== undefined) {
      const normalizedQuantity = Math.max(1, payload.quantity);
      const product = await productRepository.findById(targetItem.productId);
      if (!product) {
        const error = new Error('商品不存在或已下架');
        (error as any).status = 404;
        throw error;
      }

      if (normalizedQuantity > product.stock) {
        const error = new Error(`库存不足，当前仅剩 ${product.stock} 件`);
        (error as any).status = 400;
        throw error;
      }

      normalizedPayload.quantity = normalizedQuantity;
    }

    await cartRepository.updateItem(userId, itemId, normalizedPayload);
  }

  async removeItem(userId: string, itemId: string) {
    await cartRepository.removeItem(userId, itemId);
  }

  async selectAll(userId: string, selected: boolean) {
    await cartRepository.setSelectAll(userId, selected);
  }
}

