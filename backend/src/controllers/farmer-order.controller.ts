import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import {
  OrderService,
  type LogisticsCheckpointPayload,
  type SetLogisticsPayload,
  type UpdateAfterSalePayload,
  type UpdateOrderStatusPayload,
} from '../services/order.service';
import { DEFAULT_FARMER_ID } from '../constants/farmer';

const orderService = new OrderService();

const farmerListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled', 'after-sale']).optional(),
  }),
});

const farmerDetailSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const farmerUpdateStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled', 'after-sale']),
    note: z.string().optional(),
  }),
});

const farmerSetLogisticsSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    carrier: z.string().min(1, '请输入物流公司'),
    trackingNumber: z.string().min(1, '请输入运单号'),
    contactPhone: z
      .string()
      .regex(/^1\d{10}$/, '请输入正确的手机号')
      .optional(),
  }),
});

const farmerAppendCheckpointSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.string().min(1, '请输入节点状态'),
    description: z.string().optional(),
    location: z.string().optional(),
  }),
});

const farmerUpdateAfterSaleSchema = z.object({
  params: z.object({ id: z.string() }),
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

const listValidators = validateRequest(farmerListSchema);
const detailValidators = validateRequest(farmerDetailSchema);
const updateStatusValidators = validateRequest(farmerUpdateStatusSchema);
const setLogisticsValidators = validateRequest(farmerSetLogisticsSchema);
const appendCheckpointValidators = validateRequest(farmerAppendCheckpointSchema);
const updateAfterSaleValidators = validateRequest(farmerUpdateAfterSaleSchema);

function ensureFarmer(req: Request): { id: string; role: string; farmerId: string } {
  const user = (req as any).user as { id: string; role: string; farmerProfileId?: string } | undefined;
  if (!user) {
    const error = new Error('未授权');
    (error as any).status = 401;
    throw error;
  }
  if (!['farmer', 'admin'].includes(user.role)) {
    const error = new Error('无权限访问');
    (error as any).status = 403;
    throw error;
  }
  const farmerId = user.role === 'admin' ? user.id : user.farmerProfileId ?? DEFAULT_FARMER_ID;
  return { ...user, farmerId };
}

export const listFarmerOrdersValidators = listValidators;
export const getFarmerOrderDetailValidators = detailValidators;
export const updateFarmerOrderStatusValidators = updateStatusValidators;
export const setFarmerLogisticsValidators = setLogisticsValidators;
export const appendFarmerCheckpointValidators = appendCheckpointValidators;
export const updateFarmerAfterSaleValidators = updateAfterSaleValidators;

export const listFarmerOrders = asyncHandler(async (req: Request, res: Response) => {
  const farmer = ensureFarmer(req);
  const { query } = farmerListSchema.parse({ query: req.query });
  const sanitizedQuery = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Parameters<typeof orderService.listOrdersForFarmer>[1];
  const result = await orderService.listOrdersForFarmer(farmer.farmerId, sanitizedQuery);
  res.json({ success: true, data: result });
});

export const getFarmerOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const farmer = ensureFarmer(req);
  const { params } = farmerDetailSchema.parse({ params: req.params });
  const order = await orderService.getOrderDetailForFarmer(farmer.farmerId, params.id);
  res.json({ success: true, data: order });
});

export const updateFarmerOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const farmer = ensureFarmer(req);
  const { params, body } = farmerUpdateStatusSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as UpdateOrderStatusPayload;
  const order = await orderService.updateOrderStatusForFarmer(farmer.farmerId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const setFarmerLogistics = asyncHandler(async (req: Request, res: Response) => {
  const farmer = ensureFarmer(req);
  const { params, body } = farmerSetLogisticsSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as SetLogisticsPayload;
  const order = await orderService.setLogisticsForFarmer(farmer.farmerId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const appendFarmerLogisticsCheckpoint = asyncHandler(async (req: Request, res: Response) => {
  const farmer = ensureFarmer(req);
  const { params, body } = farmerAppendCheckpointSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as LogisticsCheckpointPayload;
  const order = await orderService.appendLogisticsCheckpointForFarmer(farmer.farmerId, params.id, sanitized);
  res.json({ success: true, data: order });
});

export const updateFarmerAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const farmer = ensureFarmer(req);
  const { params, body } = farmerUpdateAfterSaleSchema.parse({ params: req.params, body: req.body });
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  ) as UpdateAfterSalePayload;
  const order = await orderService.updateAfterSaleForFarmer(farmer.farmerId, params.id, sanitized);
  res.json({ success: true, data: order });
});
