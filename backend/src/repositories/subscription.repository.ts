import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import type {
  CreateSubscriptionPlanPayload,
  CreateUserSubscriptionPayload,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionCycle,
  SubscriptionItem,
  UserSubscription,
  UpdateSubscriptionPlanPayload,
} from '../types/subscription';

function mapPlan(record: any): SubscriptionPlan {
  const plan: SubscriptionPlan = {
    id: record.id,
    title: record.title,
    price: Number(record.price),
    cycle: record.cycle as SubscriptionCycle,
    benefits: record.benefits ?? [],
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };

  if (record.subtitle) plan.subtitle = record.subtitle;
  if (record.description) plan.description = record.description;
  if (record.coverImage) plan.coverImage = record.coverImage;
  if (record.originalPrice !== null && record.originalPrice !== undefined) {
    plan.originalPrice = Number(record.originalPrice);
  }
  if (record.deliverWeekday !== null && record.deliverWeekday !== undefined) {
    plan.deliverWeekday = record.deliverWeekday;
  }
  if (record.items) {
    plan.items = record.items as SubscriptionItem[];
  }
  if (record.farmerId) {
    plan.farmerId = record.farmerId;
  } else {
    plan.farmerId = null;
  }

  return plan;
}

function mapUserSubscription(record: any): UserSubscription {
  return {
    id: record.id,
    userId: record.userId,
    plan: mapPlan(record.plan),
    quantity: record.quantity,
    status: record.status as SubscriptionStatus,
    startDate: record.startDate.toISOString(),
    nextDeliveryDate: record.nextDeliveryDate ? record.nextDeliveryDate.toISOString() : null,
    lastShipmentAt: record.lastShipmentAt ? record.lastShipmentAt.toISOString() : null,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class SubscriptionRepository {
  async listActivePlans(): Promise<SubscriptionPlan[]> {
    const records = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return records.map(mapPlan);
  }

  async listPlansForFarmer(farmerId: string): Promise<SubscriptionPlan[]> {
    const records = await prisma.subscriptionPlan.findMany({ where: { farmerId }, orderBy: { createdAt: 'desc' } });
    return records.map(mapPlan);
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const record = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    return record ? mapPlan(record) : null;
  }

  async createPlan(payload: CreateSubscriptionPlanPayload): Promise<SubscriptionPlan> {
    const data: Prisma.SubscriptionPlanUncheckedCreateInput = {
      title: payload.title,
      price: payload.price,
      cycle: payload.cycle,
      benefits: payload.benefits ?? [],
    };

    if (payload.subtitle !== undefined) data.subtitle = payload.subtitle ?? null;
    if (payload.description !== undefined) data.description = payload.description ?? null;
    if (payload.coverImage !== undefined) data.coverImage = payload.coverImage ?? null;
    if (payload.originalPrice !== undefined) data.originalPrice = payload.originalPrice ?? null;
    if (payload.deliverWeekday !== undefined) data.deliverWeekday = payload.deliverWeekday ?? null;
    if (payload.items !== undefined) data.items = payload.items ?? Prisma.JsonNull;
    if (payload.farmerId !== undefined) data.farmerId = payload.farmerId ?? null;

    const record = await prisma.subscriptionPlan.create({ data });

    return mapPlan(record);
  }

  async updatePlan(planId: string, payload: UpdateSubscriptionPlanPayload): Promise<SubscriptionPlan> {
    const data: Prisma.SubscriptionPlanUncheckedUpdateInput = {};

    if (payload.title !== undefined) data.title = payload.title;
    if (payload.subtitle !== undefined) data.subtitle = payload.subtitle ?? null;
    if (payload.description !== undefined) data.description = payload.description ?? null;
    if (payload.coverImage !== undefined) data.coverImage = payload.coverImage ?? null;
    if (payload.price !== undefined) data.price = payload.price;
    if (payload.originalPrice !== undefined) data.originalPrice = payload.originalPrice ?? null;
    if (payload.cycle !== undefined) data.cycle = payload.cycle;
    if (payload.deliverWeekday !== undefined) data.deliverWeekday = payload.deliverWeekday ?? null;
    if (payload.items !== undefined) {
      data.items = payload.items ?? Prisma.JsonNull;
    }
    if (payload.benefits !== undefined) data.benefits = payload.benefits;
    if (payload.farmerId !== undefined) data.farmerId = payload.farmerId ?? null;
    if (payload.isActive !== undefined) data.isActive = payload.isActive;

    const record = await prisma.subscriptionPlan.update({ where: { id: planId }, data });

    return mapPlan(record);
  }

  async listUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const records = await prisma.userSubscription.findMany({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(mapUserSubscription);
  }

  async createUserSubscription(userId: string, payload: CreateUserSubscriptionPayload): Promise<UserSubscription> {
    const data: Prisma.UserSubscriptionUncheckedCreateInput = {
      userId,
      planId: payload.planId,
      quantity: payload.quantity ?? 1,
    };

    if (payload.notes !== undefined) data.notes = payload.notes ?? null;
    if (payload.startDate) data.startDate = new Date(payload.startDate);

    const record = await prisma.userSubscription.create({
      data,
      include: { plan: true },
    });

    return mapUserSubscription(record);
  }

  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<UserSubscription> {
    const record = await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: { status },
      include: { plan: true },
    });

    return mapUserSubscription(record);
  }
}
