export type SubscriptionCycle = 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'completed';

export type SubscriptionItem = {
  name: string;
  quantity?: string;
  description?: string;
  image?: string;
};

export type SubscriptionPlan = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  coverImage?: string | null;
  price: number;
  originalPrice?: number | null;
  cycle: SubscriptionCycle;
  deliverWeekday?: number | null;
  items?: SubscriptionItem[];
  benefits: string[];
  isActive: boolean;
  farmerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubscriptionPayload = {
  planId: string;
  quantity?: number;
  startDate?: string;
  notes?: string;
};

export type CreateSubscriptionPlanPayload = {
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  price: number;
  originalPrice?: number;
  cycle: SubscriptionCycle;
  deliverWeekday?: number;
  items?: SubscriptionItem[];
  benefits?: string[];
  farmerId?: string;
};

export type UpdateSubscriptionPlanPayload = Partial<CreateSubscriptionPlanPayload> & {
  isActive?: boolean;
};

export type UserSubscription = {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  quantity: number;
  status: SubscriptionStatus;
  startDate: string;
  nextDeliveryDate?: string | null;
  lastShipmentAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};
