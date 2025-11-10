import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { SubscriptionService } from '../services/subscription.service';
import type { AuthUser } from '../types/auth';
import type {
  CreateSubscriptionPlanPayload,
  CreateUserSubscriptionPayload,
  UpdateSubscriptionPlanPayload,
} from '../types/subscription';

const subscriptionService = new SubscriptionService();

const planCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1, '请输入订阅名称'),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().url().optional(),
    price: z.number().positive('价格必须大于 0'),
    originalPrice: z.number().positive().optional(),
    cycle: z.enum(['weekly', 'biweekly', 'monthly', 'seasonal']),
    deliverWeekday: z.number().int().min(0).max(6).optional(),
    items: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.string().optional(),
          description: z.string().optional(),
          image: z.string().url().optional(),
        }),
      )
      .optional(),
    benefits: z.array(z.string()).optional(),
    farmerId: z.string().optional(),
  }),
});

const planUpdateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: planCreateSchema.shape.body.partial().extend({ isActive: z.boolean().optional() }),
});

const planIdSchema = z.object({ params: z.object({ id: z.string() }) });

const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string(),
    quantity: z.number().int().min(1).optional(),
    startDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

const updateSubscriptionStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(['active', 'paused', 'cancelled', 'completed']) }),
});

export const createPlanValidators = validateRequest(planCreateSchema);
export const updatePlanValidators = validateRequest(planUpdateSchema);
export const getPlanValidators = validateRequest(planIdSchema);
export const createSubscriptionValidators = validateRequest(createSubscriptionSchema);
export const updateSubscriptionStatusValidators = validateRequest(updateSubscriptionStatusSchema);

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

function ensureFarmerOrAdmin(user: AuthUser | undefined, farmerId?: string) {
  if (!user) {
    const error = new Error('未授权');
    (error as any).status = 401;
    throw error;
  }

  if (user.role === 'admin') {
    return;
  }

  if (user.role !== 'farmer') {
    const error = new Error('当前账号无操作权限');
    (error as any).status = 403;
    throw error;
  }

  if (farmerId && user.farmerProfileId && user.farmerProfileId !== farmerId) {
    const error = new Error('不能编辑其他农户的订阅计划');
    (error as any).status = 403;
    throw error;
  }
}

export const listSubscriptionPlans = asyncHandler(async (req: Request, res: Response) => {
  const plans = await subscriptionService.listPlans();
  res.json({ success: true, data: plans });
});

export const getSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const { params } = planIdSchema.parse({ params: req.params });
  const plan = await subscriptionService.getPlan(params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: '订阅方案不存在' });
  }
  res.json({ success: true, data: plan });
});

export const createSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  const { body } = planCreateSchema.parse({ body: req.body });

  ensureFarmerOrAdmin(user, body.farmerId);

  const payload = stripUndefined(body) as CreateSubscriptionPlanPayload;
  const plan = await subscriptionService.createPlan(payload);
  res.status(201).json({ success: true, data: plan });
});

export const updateSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  const { params, body } = planUpdateSchema.parse({ params: req.params, body: req.body });

  const plan = await subscriptionService.getPlan(params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: '订阅方案不存在' });
  }

  ensureFarmerOrAdmin(user, body.farmerId ?? plan.farmerId ?? undefined);

  const payload = stripUndefined(body) as UpdateSubscriptionPlanPayload;
  const updated = await subscriptionService.updatePlan(params.id, payload);
  res.json({ success: true, data: updated });
});

export const listUserSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const data = await subscriptionService.listUserSubscriptions(user.id);
  res.json({ success: true, data });
});

export const createUserSubscription = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { body } = createSubscriptionSchema.parse({ body: req.body });
  const plan = await subscriptionService.getPlan(body.planId);
  if (!plan || !plan.isActive) {
    return res.status(404).json({ success: false, message: '订阅方案不存在或已下架' });
  }

  const payload = stripUndefined(body) as CreateUserSubscriptionPayload;
  const subscription = await subscriptionService.createUserSubscription(user.id, payload);
  res.status(201).json({ success: true, data: subscription });
});

export const updateUserSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = updateSubscriptionStatusSchema.parse({ params: req.params, body: req.body });
  const subsList = await subscriptionService.listUserSubscriptions(user.id);
  const target = subsList.find((item) => item.id === params.id);
  if (!target) {
    return res.status(404).json({ success: false, message: '订阅不存在' });
  }

  const updated = await subscriptionService.updateSubscriptionStatus(params.id, body.status);
  res.json({ success: true, data: updated });
});

export const listFarmerSubscriptionPlans = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (user.role !== 'farmer' && user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '仅支持农户或管理员查看' });
  }

  const farmerId = user.role === 'admin' ? req.query.farmerId?.toString() ?? user.farmerProfileId ?? undefined : user.farmerProfileId;
  if (!farmerId) {
    return res.status(400).json({ success: false, message: '当前账号未关联农户档案' });
  }

  const plans = await subscriptionService.listPlansForFarmer(farmerId);
  res.json({ success: true, data: plans });
});
