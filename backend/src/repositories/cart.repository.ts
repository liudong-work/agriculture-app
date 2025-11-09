import { prisma } from '../lib/prisma';
import type { CartItem } from '../types/cart';

function mapCartItem(record: any): CartItem {
  return {
    id: record.id,
    productId: record.productId,
    quantity: record.quantity,
    selected: record.selected,
  };
}

export class CartRepository {
  async getCartByUser(userId: string): Promise<CartItem[]> {
    const records = await prisma.cartItem.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return records.map(mapCartItem);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findFirst({ where: { userId, productId } });
      if (existing) {
        const updated = await tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
            selected: true,
          },
        });
        return mapCartItem(updated);
      }

      const created = await tx.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          selected: true,
        },
      });

      return mapCartItem(created);
    });
  }

  async updateItem(userId: string, itemId: string, payload: Partial<CartItem>): Promise<CartItem> {
    const existing = await prisma.cartItem.findFirst({ where: { id: itemId, userId } });
    if (!existing) {
      const error = new Error('购物车商品不存在');
      (error as any).status = 404;
      throw error;
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
        ...(payload.selected !== undefined ? { selected: payload.selected } : {}),
      },
    });

    return mapCartItem(updated);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const existing = await prisma.cartItem.findFirst({ where: { id: itemId, userId } });
    if (!existing) {
      const error = new Error('购物车商品不存在');
      (error as any).status = 404;
      throw error;
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
  }

  async setSelectAll(userId: string, selected: boolean): Promise<void> {
    await prisma.cartItem.updateMany({ where: { userId }, data: { selected } });
  }

  async saveCart(userId: string, items: CartItem[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { userId } });
      if (items.length === 0) {
        return;
      }
      await tx.cartItem.createMany({
        data: items.map((item) => ({
          id: item.id,
          userId,
          productId: item.productId,
          quantity: item.quantity,
          selected: item.selected,
        })),
      });
    });
  }
}

