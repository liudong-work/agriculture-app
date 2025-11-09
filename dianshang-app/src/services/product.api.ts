import { apiClient } from './apiClient';

export type ProductStatus = 'draft' | 'active' | 'inactive';

type ProductListParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
  sortBy?: 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
  status?: ProductStatus | 'all';
  farmerId?: string;
};

export type ProductListItem = {
  id: string;
  farmerId?: string;
  name: string;
  price: number;
  unit: string;
  origin: string;
  thumbnail: string;
  categoryId: string;
  seasonalTag?: string | undefined;
  isOrganic?: boolean | undefined;
  stock: number;
  status: ProductStatus;
};

export type ProductDetail = {
  id: string;
  farmerId?: string;
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

type ProductListResponse = {
  success: boolean;
  data: {
    items: ProductListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
};

type ProductDetailResponse = {
  success: boolean;
  data: ProductDetail;
};

type CreateProductResponse = {
  success: boolean;
  data: ProductDetail;
};

export type CreateProductPayload = {
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

export type UpdateProductPayload = {
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

export async function fetchProductList(params: ProductListParams = {}) {
  const response = await apiClient.get<ProductListResponse>('/products', { params });
  return response.data.data;
}

export async function fetchProductDetail(productId: string) {
  const response = await apiClient.get<ProductDetailResponse>(`/products/${productId}`);
  return response.data.data;
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await apiClient.post<CreateProductResponse>('/products', payload);
  return response.data.data;
}

export async function updateProduct(productId: string, payload: UpdateProductPayload) {
  const response = await apiClient.put<CreateProductResponse>(`/products/${productId}`, payload);
  return response.data.data;
}

export async function updateProductStatus(productId: string, status: ProductStatus) {
  const response = await apiClient.patch<CreateProductResponse>(`/products/${productId}/status`, { status });
  return response.data.data;
}

