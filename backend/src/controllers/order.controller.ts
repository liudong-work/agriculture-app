import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import {
  OrderService,
  type AfterSalePayload,
  type CancelOrderPayload,
  type CreateOrderPayload,
  type LogisticsCheckpointPayload,
  type SetLogisticsPayload,
  type UpdateAfterSalePayload,
  type UpdateOrderStatusPayload,
} from '../services/order.service';

const orderService = new OrderService();

const createSchema = z.object({
  body: z.object({
    contactName: z.string().min(1, '请填写收货人姓名'),
    contactPhone: z
      .string()
      .regex(/^1\d{10}$/, '请输入正确的手机号'),
    address: z.string().min(5, '请填写完整的收货地址'),
    paymentMethod: z.enum(['wechat', 'alipay', 'cash-on-delivery']),
    note: z.string().optional(),
  }),
});

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled', 'after-sale']).optional(),
  }),
});

const detailSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled', 'after-sale']),
    note: z.string().optional(),
  }),
});

const setLogisticsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    carrier: z.string().min(1, '请输入物流公司'),
    trackingNumber: z.string().min(1, '请输入运单号'),
    contactPhone: z
      .string()
      .regex(/^1\d{10}$/, '请输入正确的手机号')
      .optional(),
  }),
});

const appendCheckpointSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.string().min(1, '请输入节点状态'),
    description: z.string().optional(),
    location: z.string().optional(),
  }),
});

const cancelSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    reason: z.string().min(1, '请填写取消原因'),
  }),
});

const afterSaleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    type: z.enum(['refund', 'return-refund', 'exchange']),
    reason: z.string().min(1, '请填写售后原因'),
    description: z.string().optional(),
    attachments: z.array(z.string()).max(5).optional(),
  }),
});

const updateAfterSaleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['processing', 'resolved', 'rejected']),
    resolutionNote: z.string().optional(),
    refund: z
      .object({
        amount: z.number().positive(),
        method: z.enum(['original', 'wallet', 'bank']),
        referenceId: z.string().optional(),
        completedAt: z.string().optional(),
      })
      .optional(),
  }),
});

export const createOrderValidators = validateRequest(createSchema);
export const listOrderValidators = validateRequest(listSchema);
export const detailOrderValidators = validateRequest(detailSchema);
export const updateStatusValidators = validateRequest(updateStatusSchema);
export const setLogisticsValidators = validateRequest(setLogisticsSchema);
export const appendCheckpointValidators = validateRequest(appendCheckpointSchema);
export const cancelOrderValidators = validateRequest(cancelSchema);
export const applyAfterSaleValidators = validateRequest(afterSaleSchema);
export const updateAfterSaleValidators = validateRequest(updateAfterSaleSchema);

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { body } = createSchema.parse({ body: req.body });
  const sanitizedBody = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as CreateOrderPayload;

  const order = await orderService.createOrder(userId, sanitizedBody);
  res.status(201).json({ success: true, data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { query } = listSchema.parse({ query: req.query });
  const sanitizedQuery = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Parameters<typeof orderService.listOrders>[1];

  const result = await orderService.listOrders(userId, sanitizedQuery);
  res.json({ success: true, data: result });
});

export const getOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params } = detailSchema.parse({ params: req.params });
  const order = await orderService.getOrderDetail(userId, params.id);
  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = updateStatusSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as UpdateOrderStatusPayload;
  const order = await orderService.updateOrderStatus(userId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const setLogistics = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = setLogisticsSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as SetLogisticsPayload;
  const order = await orderService.setLogistics(userId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const appendLogisticsCheckpoint = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = appendCheckpointSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as LogisticsCheckpointPayload;
  const order = await orderService.appendLogisticsCheckpoint(userId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = cancelSchema.parse({ params: req.params, body: req.body });
  const order = await orderService.cancelOrder(userId, params.id, body as CancelOrderPayload);
  res.json({ success: true, data: order });
});

export const applyAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = afterSaleSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  ) as AfterSalePayload;
  const order = await orderService.applyAfterSale(userId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const updateAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = updateAfterSaleSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  ) as UpdateAfterSalePayload;
  const order = await orderService.updateAfterSale(userId, params.id, sanitized);
  res.json({ success: true, data: order });
});


