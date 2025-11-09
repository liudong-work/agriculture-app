import { randomUUID } from 'crypto';

import { CartRepository } from '../repositories/cart.repository';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { DEFAULT_FARMER_ID } from '../constants/farmer';
import type { CartResult } from '../types/cart';
import type {
  AfterSaleInfo,
  AfterSaleStatus,
  AfterSaleRefundInfo,
  LogisticsCheckpoint,
  Order,
  OrderListParams,
  OrderListResult,
  OrderLogistics,
  OrderStatus,
  OrderStatusHistoryEntry,
  PaymentMethod,
} from '../types/order';
import { calculateCartSummary } from './cart.service';

const cartRepository = new CartRepository();
const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();

export type CreateOrderPayload = {
  contactName: string;
  contactPhone: string;
  address: string;
  paymentMethod: PaymentMethod;
  note?: string;
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
  note?: string;
};

export type SetLogisticsPayload = {
  carrier: string;
  trackingNumber: string;
  contactPhone?: string;
};

export type LogisticsCheckpointPayload = {
  status: string;
  description?: string;
  location?: string;
};

export type CancelOrderPayload = {
  reason: string;
};

export type AfterSalePayload = {
  type: 'refund' | 'return-refund' | 'exchange';
  reason: string;
  description?: string;
  attachments?: string[];
};

export type UpdateAfterSalePayload = {
  status: 'processing' | 'resolved' | 'rejected';
  resolutionNote?: string;
  refund?: {
    amount: number;
    method: 'original' | 'wallet' | 'bank';
    referenceId?: string;
    completedAt?: string;
  };
};

export class OrderService {
  async createOrder(userId: string, payload: CreateOrderPayload): Promise<Order> {
    const rawCartItems = await cartRepository.getCartByUser(userId);

    if (rawCartItems.length === 0) {
      const error = new Error('购物车为空');
      (error as any).status = 400;
      throw error;
    }

    const enrichedItems: CartResult['items'] = [];

    for (const cartItem of rawCartItems) {
      if (!cartItem.selected) {
        continue;
      }

      const product = await productRepository.findById(cartItem.productId);
      if (!product) {
        const error = new Error('购物车中存在已下架商品');
        (error as any).status = 404;
        throw error;
      }

      if (product.stock < cartItem.quantity) {
        const error = new Error(`商品「${product.name}」库存不足，当前仅剩 ${product.stock} 件`);
        (error as any).status = 400;
        throw error;
      }

      enrichedItems.push({
        ...cartItem,
        product,
      });
    }

    if (enrichedItems.length === 0) {
      const error = new Error('请先选择要结算的商品');
      (error as any).status = 400;
      throw error;
    }

    const summary = calculateCartSummary(enrichedItems);

    const farmerIds = new Set(
      enrichedItems.map((item) => item.product.farmerId ?? DEFAULT_FARMER_ID),
    );

    if (farmerIds.size > 1) {
      const error = new Error('当前订单包含多个农户的商品，请分单结算');
      (error as any).status = 400;
      throw error;
    }

    const orderFarmerId = farmerIds.values().next().value ?? DEFAULT_FARMER_ID;

    const orderItems = enrichedItems.map((item) => ({
      id: randomUUID(),
      productId: item.product.id,
      name: item.product.name,
      thumbnail:
        item.product.images[0] ??
        'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=60',
      unit: item.product.unit,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    // 扣减库存
    for (const item of enrichedItems) {
      await productRepository.adjustStock(item.product.id, -item.quantity);
    }

    const now = new Date().toISOString();
    const historyEntry: OrderStatusHistoryEntry = {
      status: 'pending',
      timestamp: now,
      note: '订单已创建',
    };

    const orderBase: Omit<Order, 'note'> = {
      id: `order-${Date.now()}-${randomUUID().slice(0, 6)}`,
      userId,
      farmerId: orderFarmerId,
      status: 'pending',
      createdAt: now,
      subtotal: summary.subtotal,
      discount: summary.discount,
      deliveryFee: summary.deliveryFee,
      total: summary.total,
      items: orderItems,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      statusHistory: [historyEntry],
    };

    const order: Order = payload.note ? { ...orderBase, note: payload.note } : orderBase;

    await orderRepository.create(order);

    const remainingCartItems = rawCartItems.filter((item) => !item.selected);
    await cartRepository.saveCart(userId, remainingCartItems);

    return order;
  }

  async listOrders(userId: string, params: OrderListParams): Promise<OrderListResult> {
    return orderRepository.listByUser(userId, params);
  }

  async getOrderDetail(userId: string, orderId: string): Promise<Order> {
    const order = await orderRepository.findById(userId, orderId);
    if (!order) {
      const error = new Error('订单不存在');
      (error as any).status = 404;
      throw error;
    }
    return order;
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    payload: UpdateOrderStatusPayload,
  ): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    return this.applyUpdateStatus(order, payload);
  }

  async setLogistics(
    userId: string,
    orderId: string,
    payload: SetLogisticsPayload,
  ): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    return this.applySetLogistics(order, payload);
  }

  async appendLogisticsCheckpoint(
    userId: string,
    orderId: string,
    payload: LogisticsCheckpointPayload,
  ): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    return this.applyAppendLogistics(order, payload);
  }

  async cancelOrder(userId: string, orderId: string, payload: CancelOrderPayload): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    if (!['pending', 'processing'].includes(order.status)) {
      const error = new Error('当前订单状态不支持取消');
      (error as any).status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    order.status = 'cancelled';
    order.cancellation = {
      reason: payload.reason,
      cancelledAt: timestamp,
    };
    order.statusHistory.push({
      status: 'cancelled',
      timestamp,
      note: payload.reason,
    });

    return order;
  }

  async applyAfterSale(userId: string, orderId: string, payload: AfterSalePayload): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    if (!['shipped', 'completed'].includes(order.status)) {
      const error = new Error('仅支持已发货或已完成的订单申请售后');
      (error as any).status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    const afterSale: AfterSaleInfo = {
      type: payload.type,
      reason: payload.reason,
      status: 'applied',
      appliedAt: timestamp,
      updatedAt: timestamp,
    };
    if (payload.description) {
      afterSale.description = payload.description;
    }
    if (payload.attachments && payload.attachments.length > 0) {
      afterSale.attachments = payload.attachments;
    }

    order.afterSale = afterSale;
    order.status = 'after-sale';
    order.statusHistory.push({
      status: 'after-sale',
      timestamp,
      note: payload.reason,
    });

    return order;
  }

  async updateAfterSale(
    userId: string,
    orderId: string,
    payload: UpdateAfterSalePayload,
  ): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    return this.applyUpdateAfterSale(order, payload);
  }

  async listOrdersForFarmer(farmerId: string, params: OrderListParams): Promise<OrderListResult> {
    return orderRepository.listByFarmer(farmerId, params);
  }

  async getOrderDetailForFarmer(farmerId: string, orderId: string): Promise<Order> {
    return this.getOrderForFarmer(orderId, farmerId);
  }

  async updateOrderStatusForFarmer(
    farmerId: string,
    orderId: string,
    payload: UpdateOrderStatusPayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.applyUpdateStatus(order, payload);
  }

  async setLogisticsForFarmer(
    farmerId: string,
    orderId: string,
    payload: SetLogisticsPayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.applySetLogistics(order, payload);
  }

  async appendLogisticsCheckpointForFarmer(
    farmerId: string,
    orderId: string,
    payload: LogisticsCheckpointPayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.applyAppendLogistics(order, payload);
  }

  async updateAfterSaleForFarmer(
    farmerId: string,
    orderId: string,
    payload: UpdateAfterSalePayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.applyUpdateAfterSale(order, payload);
  }

  private async getOrderForFarmer(orderId: string, farmerId: string): Promise<Order> {
    const order = await orderRepository.findByIdGlobal(orderId);
    if (!order || order.farmerId !== farmerId) {
      const error = new Error('订单不存在');
      (error as any).status = 404;
      throw error;
    }
    return order;
  }

  private applyUpdateStatus(order: Order, payload: UpdateOrderStatusPayload): Order {
    if (order.status === payload.status) {
      return order;
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed', 'after-sale'],
      completed: ['after-sale'],
      cancelled: [],
      'after-sale': ['completed'],
    };

    const nextStatuses = allowedTransitions[order.status] ?? [];
    if (!nextStatuses.includes(payload.status)) {
      const error = new Error(`无法从 ${order.status} 流转到 ${payload.status}`);
      (error as any).status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    order.status = payload.status;
    const historyEntry: OrderStatusHistoryEntry = {
      status: payload.status,
      timestamp,
    };
    if (payload.note) {
      historyEntry.note = payload.note;
    }
    order.statusHistory.push(historyEntry);

    if (payload.status === 'cancelled') {
      order.cancellation = {
        reason: payload.note ?? '用户取消订单',
        cancelledAt: timestamp,
      };
    }

    if (payload.status === 'completed' && order.afterSale) {
      order.afterSale.status = 'resolved';
      order.afterSale.updatedAt = timestamp;
      order.afterSale.resolutionNote = payload.note ?? '售后已完成';
    }

    return order;
  }

  private applySetLogistics(order: Order, payload: SetLogisticsPayload): Order {
    if (order.status === 'cancelled') {
      const error = new Error('已取消的订单无法更新物流信息');
      (error as any).status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    const logistics: OrderLogistics = {
      carrier: payload.carrier,
      trackingNumber: payload.trackingNumber,
      updatedAt: timestamp,
      checkpoints: order.logistics?.checkpoints ?? [],
    };
    if (payload.contactPhone) {
      logistics.contactPhone = payload.contactPhone;
    }

    order.logistics = logistics;
    return order;
  }

  private applyAppendLogistics(order: Order, payload: LogisticsCheckpointPayload): Order {
    if (!order.logistics) {
      const error = new Error('请先填写物流承运信息');
      (error as any).status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    const checkpoint: LogisticsCheckpoint = {
      status: payload.status,
      timestamp,
    };
    if (payload.description) {
      checkpoint.description = payload.description;
    }
    if (payload.location) {
      checkpoint.location = payload.location;
    }
    order.logistics.checkpoints.push(checkpoint);
    order.logistics.updatedAt = timestamp;

    if (payload.status === '已签收' && order.status !== 'completed') {
      order.status = 'completed';
      order.statusHistory.push({
        status: 'completed',
        timestamp,
        note: '物流签收自动完成订单',
      });
    }

    return order;
  }

  private applyUpdateAfterSale(order: Order, payload: UpdateAfterSalePayload): Order {
    if (!order.afterSale) {
      const error = new Error('该订单尚未申请售后');
      (error as any).status = 400;
      throw error;
    }

    const allowedNextStatuses: Record<AfterSaleStatus, AfterSaleStatus[]> = {
      applied: ['processing', 'resolved', 'rejected'],
      processing: ['resolved', 'rejected'],
      resolved: [],
      rejected: [],
    };

    const currentStatus = order.afterSale.status;
    if (!(allowedNextStatuses[currentStatus] ?? []).includes(payload.status)) {
      const error = new Error(`售后状态无法从 ${currentStatus} 流转到 ${payload.status}`);
      (error as any).status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    order.afterSale.status = payload.status;
    order.afterSale.updatedAt = timestamp;
    if (payload.resolutionNote) {
      order.afterSale.resolutionNote = payload.resolutionNote;
    }
    if (payload.refund) {
      const refundInfo: AfterSaleRefundInfo = {
        amount: payload.refund.amount,
        method: payload.refund.method,
        completedAt: payload.refund.completedAt ?? timestamp,
      };
      if (payload.refund.referenceId) {
        refundInfo.referenceId = payload.refund.referenceId;
      }
      order.afterSale.refund = refundInfo;
    }

    order.statusHistory.push({
      status: 'after-sale',
      timestamp,
      note: payload.resolutionNote ?? `售后状态更新：${payload.status}`,
    });

    if (payload.status === 'resolved' && order.afterSale.type === 'refund') {
      order.status = 'completed';
    } else if (payload.status === 'rejected' && ['pending', 'processing'].includes(order.status)) {
      order.status = 'processing';
    }

    return order;
  }
}


