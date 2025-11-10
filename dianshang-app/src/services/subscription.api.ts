import { apiClient } from './apiClient';
import type {
  CreateSubscriptionPayload,
  CreateSubscriptionPlanPayload,
  SubscriptionPlan,
  UpdateSubscriptionPlanPayload,
  UserSubscription,
} from '../types/subscription';

export async function fetchSubscriptionPlans() {
  const response = await apiClient.get<{ success: boolean; data: SubscriptionPlan[] }>(
    '/subscriptions/plans',
  );
  return response.data.data;
}

export async function fetchSubscriptionPlan(planId: string) {
  const response = await apiClient.get<{ success: boolean; data: SubscriptionPlan }>(
    `/subscriptions/plans/${planId}`,
  );
  return response.data.data;
}

export async function fetchFarmerSubscriptionPlans() {
  const response = await apiClient.get<{ success: boolean; data: SubscriptionPlan[] }>(
    '/subscriptions/plans/mine',
  );
  return response.data.data;
}

export async function createSubscriptionPlan(payload: CreateSubscriptionPlanPayload) {
  const response = await apiClient.post<{ success: boolean; data: SubscriptionPlan }>(
    '/subscriptions/plans',
    payload,
  );
  return response.data.data;
}

export async function updateSubscriptionPlan(planId: string, payload: UpdateSubscriptionPlanPayload) {
  const response = await apiClient.patch<{ success: boolean; data: SubscriptionPlan }>(
    `/subscriptions/plans/${planId}`,
    payload,
  );
  return response.data.data;
}

export async function createSubscription(payload: CreateSubscriptionPayload) {
  const response = await apiClient.post<{ success: boolean; data: UserSubscription }>(
    '/subscriptions',
    payload,
  );
  return response.data.data;
}

export async function fetchUserSubscriptions() {
  const response = await apiClient.get<{ success: boolean; data: UserSubscription[] }>(
    '/subscriptions',
  );
  return response.data.data;
}
