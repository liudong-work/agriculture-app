import { CartRepository } from '../repositories/cart.repository';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { DEFAULT_FARMER_ID } from '../constants/farmer';
import type {
  UpdateStatusOptions,
  ApplyAfterSaleOptions,
  UpdateAfterSaleOptions,
} from '../repositories/order.repository';
import type { CartResult } from '../types/cart';
import type {
  AfterSaleStatus,
  Order,
  OrderListParams,
  OrderListResult,
  OrderStatus,
  PaymentMethod,
} from '../types/order';
import { calculateCartSummary } from './cart.service';

const cartRepository = new CartRepository();
const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=60';

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
      productId: item.product.id,
      name: item.product.name,
      thumbnail: item.product.images[0] ?? FALLBACK_THUMBNAIL,
      unit: item.product.unit,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    // 扣减库存
    for (const item of enrichedItems) {
      await productRepository.adjustStock(item.product.id, -item.quantity);
    }

    const order = await orderRepository.create({
      customerId: userId,
      farmerId: orderFarmerId,
      subtotal: summary.subtotal,
      discount: summary.discount,
      deliveryFee: summary.deliveryFee,
      total: summary.total,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      items: orderItems,
      initialNote: '订单已创建',
      ...(payload.note ? { note: payload.note } : {}),
    });

    const remainingCartItems = rawCartItems.filter((item) => !item.selected);
    await cartRepository.saveCart(userId, remainingCartItems);

    return order;
  }

  async listOrders(userId: string, params: OrderListParams): Promise<OrderListResult> {
    return orderRepository.listByUser(userId, params);
  }

  async getOrderDetail(userId: string, orderId: string): Promise<Order> {
    const order = await orderRepository.findByCustomer(orderId, userId);
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
    const updateOptions: UpdateStatusOptions = {
      status: payload.status,
    };

    if (payload.note && payload.note.trim().length > 0) {
      updateOptions.note = payload.note;
    }

    if (payload.status === 'cancelled') {
      updateOptions.cancellation = {
        reason: payload.note ?? '用户取消订单',
      };
    }

    if (payload.status === 'completed' && order.afterSale) {
      updateOptions.resolveAfterSale = {
        note: payload.note ?? '售后已完成',
      };
    }

    const updated = await orderRepository.updateStatus(orderId, updateOptions);

    return updated;
  }

  async setLogistics(
    userId: string,
    orderId: string,
    payload: SetLogisticsPayload,
  ): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    if (order.status === 'cancelled') {
      const error = new Error('已取消的订单无法更新物流信息');
      (error as any).status = 400;
      throw error;
    }

    return orderRepository.setLogistics(orderId, payload);
  }

  async appendLogisticsCheckpoint(
    userId: string,
    orderId: string,
    payload: LogisticsCheckpointPayload,
  ): Promise<Order> {
    await this.getOrderDetail(userId, orderId);
    return orderRepository.appendLogisticsCheckpoint(orderId, payload);
  }

  async cancelOrder(userId: string, orderId: string, payload: CancelOrderPayload): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    if (!['pending', 'processing'].includes(order.status)) {
      const error = new Error('当前订单状态不支持取消');
      (error as any).status = 400;
      throw error;
    }

    return orderRepository.cancelOrder(orderId, payload.reason, payload.reason);
  }

  async applyAfterSale(userId: string, orderId: string, payload: AfterSalePayload): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
    if (!['shipped', 'completed'].includes(order.status)) {
      const error = new Error('仅支持已发货或已完成的订单申请售后');
      (error as any).status = 400;
      throw error;
    }

    const applyOptions: ApplyAfterSaleOptions = {
      type: payload.type,
      reason: payload.reason,
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.attachments && payload.attachments.length > 0
        ? { attachments: payload.attachments }
        : {}),
    };

    return orderRepository.applyAfterSale(orderId, applyOptions);
  }

  async updateAfterSale(
    userId: string,
    orderId: string,
    payload: UpdateAfterSalePayload,
  ): Promise<Order> {
    const order = await this.getOrderDetail(userId, orderId);
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

    const currentAfterSale = order.afterSale!;
    const currentStatus = currentAfterSale.status;
    if (!(allowedNextStatuses[currentStatus] ?? []).includes(payload.status)) {
      const error = new Error(`售后状态无法从 ${currentStatus} 流转到 ${payload.status}`);
      (error as any).status = 400;
      throw error;
    }

    let nextOrderStatus: OrderStatus | undefined;
    let nextOrderStatusNote: string | undefined;

    if (payload.status === 'resolved' && currentAfterSale.type === 'refund') {
      nextOrderStatus = 'completed';
      nextOrderStatusNote = payload.resolutionNote ?? '售后已完成';
    } else if (payload.status === 'rejected' && ['pending', 'processing'].includes(order.status)) {
      nextOrderStatus = 'processing';
    }

    const updateOptions: UpdateAfterSaleOptions = {
      status: payload.status,
      ...(payload.resolutionNote ? { resolutionNote: payload.resolutionNote } : {}),
      ...(payload.refund
        ? {
            refund: {
              amount: payload.refund.amount,
              method: payload.refund.method,
              ...(payload.refund.completedAt ? { completedAt: payload.refund.completedAt } : {}),
              ...(payload.refund.referenceId ? { referenceId: payload.refund.referenceId } : {}),
            },
          }
        : {}),
      ...(nextOrderStatus ? { orderStatus: nextOrderStatus } : {}),
      ...(nextOrderStatusNote ? { orderStatusNote: nextOrderStatusNote } : {}),
    };

    const updated = await orderRepository.updateAfterSale(orderId, updateOptions);

    return updated;
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
    return this.updateOrderStatus(order.userId, orderId, payload);
  }

  async setLogisticsForFarmer(
    farmerId: string,
    orderId: string,
    payload: SetLogisticsPayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.setLogistics(order.userId, orderId, payload);
  }

  async appendLogisticsCheckpointForFarmer(
    farmerId: string,
    orderId: string,
    payload: LogisticsCheckpointPayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.appendLogisticsCheckpoint(order.userId, orderId, payload);
  }

  async updateAfterSaleForFarmer(
    farmerId: string,
    orderId: string,
    payload: UpdateAfterSalePayload,
  ): Promise<Order> {
    const order = await this.getOrderForFarmer(orderId, farmerId);
    return this.updateAfterSale(order.userId, orderId, payload);
  }

  private async getOrderForFarmer(orderId: string, farmerId: string): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order || order.farmerId !== farmerId) {
      const error = new Error('订单不存在');
      (error as any).status = 404;
      throw error;
    }
    return order;
  }
}


