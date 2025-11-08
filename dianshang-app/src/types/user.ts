export type UserProfile = {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  level: string;
  points: number;
  coupons: number;
  pendingAfterSale: number;
};

export type QuickAccessItem = {
  id: string;
  icon: string;
  label: string;
  route: string;
  badge?: number;
};

