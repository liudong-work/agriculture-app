import type { Order, OrderListParams, OrderListResult, OrderStatus } from '../types/order';

const ordersByUser = new Map<string, Order[]>();
const ordersById = new Map<string, Order>();

function sortOrdersDesc(list: Order[]): Order[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export class OrderRepository {
  async create(order: Order): Promise<Order> {
    const userOrders = ordersByUser.get(order.userId) ?? [];
    userOrders.push(order);
    ordersByUser.set(order.userId, userOrders);
    ordersById.set(order.id, order);
    return order;
  }

  async listByUser(userId: string, params: OrderListParams): Promise<OrderListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const status = params.status;

    const userOrders = ordersByUser.get(userId) ?? [];

    const filtered = status ? userOrders.filter((order) => order.status === status) : userOrders;
    const ordered = sortOrdersDesc(filtered);

    const total = ordered.length;
    const start = (page - 1) * pageSize;
    const items = ordered.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }

  async findById(userId: string, orderId: string): Promise<Order | undefined> {
    const order = ordersById.get(orderId);
    if (!order || order.userId !== userId) {
      return undefined;
    }
    return order;
  }

  async updateStatus(userId: string, orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.findById(userId, orderId);
    if (!order) {
      const error = new Error('订单不存在');
      (error as any).status = 404;
      throw error;
    }

    order.status = status;
    return order;
  }

  async findByIdGlobal(orderId: string): Promise<Order | undefined> {
    return ordersById.get(orderId);
  }

  async listByFarmer(farmerId: string, params: OrderListParams): Promise<OrderListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const status = params.status;

    const allOrders = Array.from(ordersById.values());
    const filtered = allOrders.filter((order) => order.farmerId === farmerId);
    const statusFiltered = status ? filtered.filter((order) => order.status === status) : filtered;
    const ordered = sortOrdersDesc(statusFiltered);

    const total = ordered.length;
    const start = (page - 1) * pageSize;
    const items = ordered.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }
}


