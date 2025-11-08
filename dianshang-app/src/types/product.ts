export type Product = {
  id: string;
  name: string;
  description?: string;
  images: string[];
  price: number;
  originalPrice?: number;
  unit: string;
  origin: string;
  categoryId: string;
  seasonalTag?: string;
  isOrganic?: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
};

export type ProductCategory = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  parentId?: string | null;
};

export type ActivityBanner = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
};

export type ActivityCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  link: string;
};

export type LogisticsProvince = {
  code: string;
  name: string;
};

