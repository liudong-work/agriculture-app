import { apiClient } from './apiClient';
import type { Order, OrderListResponse, OrderStatus } from '../types/order';

export type FarmerOrderListParams = {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function fetchFarmerOrderList(params: FarmerOrderListParams = {}) {
  const response = await apiClient.get<ApiResponse<OrderListResponse>>('/farmer/orders', { params });
  return response.data.data;
}

export async function fetchFarmerOrderDetail(orderId: string) {
  const response = await apiClient.get<ApiResponse<Order>>(`/farmer/orders/${orderId}`);
  return response.data.data;
}

export async function updateFarmerOrderStatus(orderId: string, payload: { status: OrderStatus; note?: string }) {
  const response = await apiClient.patch<ApiResponse<Order>>(`/farmer/orders/${orderId}/status`, payload);
  return response.data.data;
}

export async function setFarmerOrderLogistics(
  orderId: string,
  payload: { carrier: string; trackingNumber: string; contactPhone?: string },
) {
  const response = await apiClient.put<ApiResponse<Order>>(`/farmer/orders/${orderId}/logistics`, payload);
  return response.data.data;
}

export async function appendFarmerLogisticsCheckpoint(
  orderId: string,
  payload: { status: string; description?: string; location?: string },
) {
  const response = await apiClient.post<ApiResponse<Order>>(`/farmer/orders/${orderId}/logistics/checkpoints`, payload);
  return response.data.data;
}

export async function updateFarmerAfterSale(
  orderId: string,
  payload: {
    status: 'processing' | 'resolved' | 'rejected';
    resolutionNote?: string;
    refund?: { amount: number; method: 'original' | 'wallet' | 'bank'; referenceId?: string; completedAt?: string };
  },
) {
  const response = await apiClient.patch<ApiResponse<Order>>(`/farmer/orders/${orderId}/after-sale`, payload);
  return response.data.data;
}
