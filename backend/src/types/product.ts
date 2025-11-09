export type ProductStatus = 'draft' | 'active' | 'inactive';

export type Product = {
  id: string;
  farmerId: string;
  name: string;
  description?: string | undefined;
  images: string[];
  price: number;
  originalPrice?: number | undefined;
  unit: string;
  origin: string;
  categoryId: string;
  seasonalTag?: string | undefined;
  isOrganic?: boolean | undefined;
  stock: number;
  status: ProductStatus;
};

export type ProductListParams = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  keyword?: string;
  sortBy?: 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
  status?: ProductStatus | 'all';
  farmerId?: string;
};

export type ProductListItem = {
  id: string;
  farmerId: string;
  name: string;
  price: number;
  unit: string;
  origin: string;
  categoryId: string;
  thumbnail: string;
  seasonalTag?: string | undefined;
  isOrganic?: boolean | undefined;
  stock: number;
  status: ProductStatus;
};

export type ProductListResult = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateProductInput = {
  name: string;
  description?: string | undefined;
  images: string[];
  price: number;
  originalPrice?: number | undefined;
  unit: string;
  origin: string;
  categoryId: string;
  seasonalTag?: string | undefined;
  isOrganic?: boolean | undefined;
  stock: number;
  status?: ProductStatus | undefined;
};

export type UpdateProductInput = {
  name?: string | undefined;
  description?: string | undefined;
  images?: string[] | undefined;
  price?: number | undefined;
  originalPrice?: number | undefined;
  unit?: string | undefined;
  origin?: string | undefined;
  categoryId?: string | undefined;
  seasonalTag?: string | undefined;
  isOrganic?: boolean | undefined;
  stock?: number | undefined;
  status?: ProductStatus | undefined;
};

