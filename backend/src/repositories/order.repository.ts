import { prisma } from '../lib/prisma';
import type {
  Order,
  OrderListParams,
  OrderListResult,
  OrderStatus,
  PaymentMethod,
  AfterSaleStatus as DomainAfterSaleStatus,
  AfterSaleType as DomainAfterSaleType,
  AfterSaleRefundInfo,
} from '../types/order';

const ORDER_INCLUDE = {
  items: true,
  statusHistory: true,
  logistics: {
    include: {
      checkpoints: true,
    },
  },
  afterSale: true,
} as const;

type DbOrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'after_sale';
type DbPaymentMethod = 'wechat' | 'alipay' | 'cash_on_delivery';
type DbAfterSaleStatus = 'applied' | 'processing' | 'resolved' | 'rejected';
type DbAfterSaleType = 'refund' | 'return_refund' | 'exchange';

type PrismaClientType = typeof prisma;
type OrderFindManyArgs = Parameters<PrismaClientType['order']['findMany']>[0];
type OrderFindManyReturn = Awaited<ReturnType<PrismaClientType['order']['findMany']>>;
type OrderUpdateArgs = Parameters<PrismaClientType['order']['update']>[0];
type AfterSaleUpdateArgs = Parameters<PrismaClientType['afterSale']['update']>[0];
type TransactionClient = any;

type PrismaOrder = any;
type OrderWhereInput = any;
type OrderUpdateInput = any;
type AfterSaleUpdateInput = any;
type StatusHistoryCreateInput = { status: DbOrderStatus; note: string | null };

type CreateOrderItemInput = {
  productId: string;
  name: string;
  thumbnail: string;
  unit: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type CreateOrderInput = {
  customerId: string;
  farmerId: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  contactName: string;
  contactPhone: string;
  address: string;
  paymentMethod: PaymentMethod;
  note?: string;
  items: CreateOrderItemInput[];
  initialNote?: string;
};

export type UpdateStatusOptions = {
  status: OrderStatus;
  note?: string;
  cancellation?: {
    reason: string;
    cancelledAt?: string;
  };
  resolveAfterSale?: {
    note?: string;
  };
};

export type ApplyAfterSaleOptions = {
  type: DomainAfterSaleType;
  reason: string;
  description?: string;
  attachments?: string[];
};

export type UpdateAfterSaleOptions = {
  status: DomainAfterSaleStatus;
  resolutionNote?: string;
  refund?: AfterSaleRefundInfo & { referenceId?: string };
  orderStatus?: OrderStatus;
  orderStatusNote?: string;
};

type AppendCheckpointInput = {
  status: string;
  description?: string;
  location?: string;
};

const UNKNOWN_PRODUCT_ID = 'unknown-product';

function hyphenToUnderscore(value: string): string {
  return value.replace(/-/g, '_');
}

function underscoreToHyphen(value: string): string {
  return value.replace(/_/g, '-');
}

function toDbOrderStatus(status: OrderStatus): DbOrderStatus {
  return hyphenToUnderscore(status) as DbOrderStatus;
}

function fromDbOrderStatus(status: DbOrderStatus): OrderStatus {
  return underscoreToHyphen(status) as OrderStatus;
}

function toDbPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  return hyphenToUnderscore(method) as DbPaymentMethod;
}

function fromDbPaymentMethod(method: DbPaymentMethod): PaymentMethod {
  return underscoreToHyphen(method) as PaymentMethod;
}

function toDbAfterSaleStatus(status: DomainAfterSaleStatus): DbAfterSaleStatus {
  return hyphenToUnderscore(status) as DbAfterSaleStatus;
}

function fromDbAfterSaleStatus(status: DbAfterSaleStatus): DomainAfterSaleStatus {
  return underscoreToHyphen(status) as DomainAfterSaleStatus;
}

function toDbAfterSaleType(type: DomainAfterSaleType): DbAfterSaleType {
  return hyphenToUnderscore(type) as DbAfterSaleType;
}

function fromDbAfterSaleType(type: DbAfterSaleType): DomainAfterSaleType {
  return underscoreToHyphen(type) as DomainAfterSaleType;
}

function normalizeOrder(record: PrismaOrder): Order {
  const items = record.items.map((item: PrismaOrder['items'][number]) => ({
    id: item.id,
    productId: item.productId ?? UNKNOWN_PRODUCT_ID,
    name: item.name,
    thumbnail: item.thumbnail,
    unit: item.unit,
    price: Number(item.price),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  }));

  const statusHistory = record.statusHistory
    .sort(
      (
        a: PrismaOrder['statusHistory'][number],
        b: PrismaOrder['statusHistory'][number],
      ) => a.createdAt.getTime() - b.createdAt.getTime(),
    )
    .map((entry: PrismaOrder['statusHistory'][number]) => ({
      status: fromDbOrderStatus(entry.status),
      timestamp: entry.createdAt.toISOString(),
      ...(entry.note ? { note: entry.note } : {}),
    }));

  const logistics = record.logistics
    ? {
        carrier: record.logistics.carrier,
        trackingNumber: record.logistics.trackingNumber,
        updatedAt: record.logistics.updatedAt.toISOString(),
        checkpoints: record.logistics.checkpoints
          .sort(
            (
              a: NonNullable<PrismaOrder['logistics']>['checkpoints'][number],
              b: NonNullable<PrismaOrder['logistics']>['checkpoints'][number],
            ) => a.timestamp.getTime() - b.timestamp.getTime(),
          )
          .map((checkpoint: NonNullable<PrismaOrder['logistics']>['checkpoints'][number]) => ({
            status: checkpoint.status,
            ...(checkpoint.description ? { description: checkpoint.description } : {}),
            ...(checkpoint.location ? { location: checkpoint.location } : {}),
            timestamp: checkpoint.timestamp.toISOString(),
          })),
        ...(record.logistics.contactPhone ? { contactPhone: record.logistics.contactPhone } : {}),
      }
    : undefined;

  const afterSale = record.afterSale
    ? (() => {
        const data: NonNullable<Order['afterSale']> = {
          type: fromDbAfterSaleType(record.afterSale.type),
          reason: record.afterSale.reason,
          status: fromDbAfterSaleStatus(record.afterSale.status),
          appliedAt: record.afterSale.createdAt.toISOString(),
          updatedAt: record.afterSale.updatedAt.toISOString(),
        };

        if (record.afterSale.description) {
          data.description = record.afterSale.description;
        }
        if (record.afterSale.attachments.length > 0) {
          data.attachments = record.afterSale.attachments;
        }
        if (record.afterSale.resolutionNote) {
          data.resolutionNote = record.afterSale.resolutionNote;
        }
        if (record.afterSale.refundAmount !== null && record.afterSale.refundAmount !== undefined) {
          const refund: AfterSaleRefundInfo = {
            amount: Number(record.afterSale.refundAmount),
            method: record.afterSale.refundMethod ?? 'original',
          };
          if (record.afterSale.refundCompletedAt) {
            refund.completedAt = record.afterSale.refundCompletedAt.toISOString();
          }
          if (record.afterSale.refundReferenceId) {
            refund.referenceId = record.afterSale.refundReferenceId;
          }
          data.refund = refund;
        }
        return data;
      })()
    : undefined;

  const cancellation =
    record.cancellationReason && record.cancellationAt
      ? {
          reason: record.cancellationReason,
          cancelledAt: record.cancellationAt.toISOString(),
        }
      : undefined;

  const base: Order = {
    id: record.id,
    userId: record.customerId,
    farmerId: record.farmerId,
    status: fromDbOrderStatus(record.status),
    createdAt: record.createdAt.toISOString(),
    subtotal: Number(record.subtotal),
    discount: Number(record.discount),
    deliveryFee: Number(record.deliveryFee),
    total: Number(record.total),
    items,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    address: record.address,
    paymentMethod: fromDbPaymentMethod(record.paymentMethod),
    statusHistory,
  };

  if (record.note) {
    base.note = record.note;
  }
  if (logistics) {
    base.logistics = logistics;
  }
  if (cancellation) {
    base.cancellation = cancellation;
  }
  if (afterSale) {
    base.afterSale = afterSale;
  }

  return base;
}

function buildPaginationResult(items: Order[], total: number, page: number, pageSize: number): OrderListResult {
  return { items, total, page, pageSize };
}

export class OrderRepository {
  async create(input: CreateOrderInput): Promise<Order> {
    const itemCreates = input.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      thumbnail: item.thumbnail,
      unit: item.unit,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const record = await prisma.order.create({
      data: {
        customerId: input.customerId,
        farmerId: input.farmerId,
        status: 'pending',
        subtotal: input.subtotal,
        discount: input.discount,
        deliveryFee: input.deliveryFee,
        total: input.total,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        address: input.address,
        note: input.note ?? null,
        paymentMethod: toDbPaymentMethod(input.paymentMethod),
        items: {
          create: itemCreates,
        },
        statusHistory: {
          create: {
            status: 'pending',
            note: input.initialNote ?? '订单已创建',
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    return normalizeOrder(record);
  }

  async listByUser(userId: string, params: OrderListParams): Promise<OrderListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const where: OrderWhereInput = {
      customerId: userId,
    };

    if (params.status) {
      where.status = toDbOrderStatus(params.status);
    }

    const [records, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return buildPaginationResult(records.map(normalizeOrder), total, page, pageSize);
  }

  async listByFarmer(farmerId: string, params: OrderListParams): Promise<OrderListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const where: OrderWhereInput = {
      farmerId,
    };

    if (params.status) {
      where.status = toDbOrderStatus(params.status);
    }

    const [records, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return buildPaginationResult(records.map(normalizeOrder), total, page, pageSize);
  }

  async findByCustomer(orderId: string, userId: string): Promise<Order | undefined> {
    const record = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId,
      },
      include: ORDER_INCLUDE,
    });

    if (!record) {
      return undefined;
    }

    return normalizeOrder(record);
  }

  async findById(orderId: string): Promise<Order | undefined> {
    const record = await prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!record) {
      return undefined;
    }

    return normalizeOrder(record);
  }

  async updateStatus(orderId: string, options: UpdateStatusOptions): Promise<Order> {
    const data: OrderUpdateInput = {
      status: toDbOrderStatus(options.status),
      statusHistory: {
        create: {
          status: toDbOrderStatus(options.status),
          note: options.note ?? null,
        },
      },
    };

    if (options.cancellation) {
      data.cancellationReason = options.cancellation.reason;
      data.cancellationAt = options.cancellation.cancelledAt
        ? new Date(options.cancellation.cancelledAt)
        : new Date();
    }

    if (options.resolveAfterSale) {
      data.afterSale = {
        update: {
          status: toDbAfterSaleStatus('resolved'),
          resolutionNote: options.resolveAfterSale.note ?? null,
        },
      };
    }

    const record = await prisma.order.update({
      where: { id: orderId },
      data,
      include: ORDER_INCLUDE,
    });

    return normalizeOrder(record);
  }

  async setLogistics(orderId: string, payload: { carrier: string; trackingNumber: string; contactPhone?: string }): Promise<Order> {
    const record = await prisma.order.update({
      where: { id: orderId },
      data: {
        logistics: {
          upsert: {
            update: {
              carrier: payload.carrier,
              trackingNumber: payload.trackingNumber,
              contactPhone: payload.contactPhone ?? null,
              updatedAt: new Date(),
            },
            create: {
              carrier: payload.carrier,
              trackingNumber: payload.trackingNumber,
              contactPhone: payload.contactPhone ?? null,
            },
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    return normalizeOrder(record);
  }

  async appendLogisticsCheckpoint(orderId: string, payload: AppendCheckpointInput): Promise<Order> {
    const record = await prisma.$transaction(async (tx: TransactionClient) => {
      const logistics = await tx.orderLogistics.findUnique({ where: { orderId } });

      if (!logistics) {
        const error = new Error('请先填写物流承运信息');
        (error as any).status = 400;
        throw error;
      }

      await tx.logisticsCheckpoint.create({
        data: {
          logisticsId: logistics.id,
          status: payload.status,
          description: payload.description ?? null,
          location: payload.location ?? null,
        },
      });

      await tx.orderLogistics.update({
        where: { orderId },
        data: { updatedAt: new Date() },
      });

      if (payload.status === '已签收') {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'completed',
            statusHistory: {
              create: {
                status: 'completed',
                note: '物流签收自动完成订单',
              },
            },
          },
        });
      }

      return tx.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    });

    if (!record) {
      const error = new Error('订单不存在');
      (error as any).status = 404;
      throw error;
    }

    return normalizeOrder(record);
  }

  async applyAfterSale(orderId: string, options: ApplyAfterSaleOptions): Promise<Order> {
    const record = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: toDbOrderStatus('after-sale'),
        statusHistory: {
          create: {
            status: toDbOrderStatus('after-sale'),
            note: options.reason,
          },
        },
        afterSale: {
          upsert: {
            update: {
              type: toDbAfterSaleType(options.type),
              reason: options.reason,
              description: options.description ?? null,
              attachments: options.attachments ?? [],
              status: toDbAfterSaleStatus('applied'),
            },
            create: {
              type: toDbAfterSaleType(options.type),
              reason: options.reason,
              description: options.description ?? null,
              attachments: options.attachments ?? [],
            },
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    return normalizeOrder(record);
  }

  async updateAfterSale(orderId: string, options: UpdateAfterSaleOptions): Promise<Order> {
    const record = await prisma.$transaction(async (tx: TransactionClient) => {
      const afterSale = await tx.afterSale.findUnique({ where: { orderId } });
      if (!afterSale) {
        const error = new Error('该订单尚未申请售后');
        (error as any).status = 400;
        throw error;
      }

      const afterSaleUpdate: AfterSaleUpdateInput = {
        status: toDbAfterSaleStatus(options.status),
        resolutionNote: options.resolutionNote ?? null,
      };

      if (options.refund) {
        afterSaleUpdate.refundAmount = { set: options.refund.amount };
        afterSaleUpdate.refundMethod = { set: options.refund.method };
        afterSaleUpdate.refundCompletedAt = {
          set: options.refund.completedAt ? new Date(options.refund.completedAt) : new Date(),
        };
        afterSaleUpdate.refundReferenceId = {
          set: options.refund.referenceId ?? null,
        };
      }

      await tx.afterSale.update({
        where: { orderId },
        data: afterSaleUpdate,
      });

      const statusHistoryCreates: StatusHistoryCreateInput[] = [
        {
          status: toDbOrderStatus('after-sale'),
          note: options.resolutionNote ?? `售后状态更新：${options.status}`,
        },
      ];

      if (options.orderStatus) {
        statusHistoryCreates.push({
          status: toDbOrderStatus(options.orderStatus),
          note: options.orderStatusNote ?? null,
        });
      }

      const orderUpdate: OrderUpdateInput = {
        statusHistory: {
          create: statusHistoryCreates,
        },
        ...(options.orderStatus ? { status: toDbOrderStatus(options.orderStatus) } : {}),
      };

      return tx.order.update({ where: { id: orderId }, data: orderUpdate, include: ORDER_INCLUDE });
    });

    return normalizeOrder(record);
  }

  async cancelOrder(orderId: string, reason: string, note?: string): Promise<Order> {
    const options: UpdateStatusOptions = {
      status: 'cancelled',
      cancellation: {
        reason,
      },
    };

    if (note) {
      options.note = note;
    }

    return this.updateStatus(orderId, options);
  }
}


