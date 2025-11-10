import { SubscriptionRepository } from '../repositories/subscription.repository';
import type {
  CreateSubscriptionPlanPayload,
  CreateUserSubscriptionPayload,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
  UpdateSubscriptionPlanPayload,
} from '../types/subscription';

const subscriptionRepository = new SubscriptionRepository();

export class SubscriptionService {
  async listPlans(): Promise<SubscriptionPlan[]> {
    return subscriptionRepository.listActivePlans();
  }

  async listPlansForFarmer(farmerId: string): Promise<SubscriptionPlan[]> {
    return subscriptionRepository.listPlansForFarmer(farmerId);
  }

  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    return subscriptionRepository.getPlanById(planId);
  }

  async createPlan(payload: CreateSubscriptionPlanPayload): Promise<SubscriptionPlan> {
    return subscriptionRepository.createPlan(payload);
  }

  async updatePlan(planId: string, payload: UpdateSubscriptionPlanPayload): Promise<SubscriptionPlan> {
    return subscriptionRepository.updatePlan(planId, payload);
  }

  async listUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return subscriptionRepository.listUserSubscriptions(userId);
  }

  async createUserSubscription(userId: string, payload: CreateUserSubscriptionPayload): Promise<UserSubscription> {
    return subscriptionRepository.createUserSubscription(userId, payload);
  }

  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<UserSubscription> {
    return subscriptionRepository.updateSubscriptionStatus(subscriptionId, status);
  }
}
