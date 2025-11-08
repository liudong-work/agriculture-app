import { apiClient } from './apiClient';
import type { Order, OrderListResponse, OrderStatus, PaymentMethod } from '../types/order';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type CreateOrderPayload = {
  contactName: string;
  contactPhone: string;
  address: string;
  paymentMethod: PaymentMethod;
  note?: string;
};

export type OrderListParams = {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
};

export async function createOrder(payload: CreateOrderPayload) {
  const response = await apiClient.post<ApiResponse<Order>>('/orders', payload);
  return response.data.data;
}

export async function fetchOrderList(params: OrderListParams = {}) {
  const response = await apiClient.get<ApiResponse<OrderListResponse>>('/orders', { params });
  return response.data.data;
}

export async function fetchOrderDetail(orderId: string) {
  const response = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
  return response.data.data;
}

export async function updateOrderStatus(orderId: string, payload: { status: OrderStatus; note?: string }) {
  const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, payload);
  return response.data.data;
}

export async function setOrderLogistics(
  orderId: string,
  payload: { carrier: string; trackingNumber: string; contactPhone?: string },
) {
  const response = await apiClient.put<ApiResponse<Order>>(`/orders/${orderId}/logistics`, payload);
  return response.data.data;
}

export async function appendLogisticsCheckpoint(
  orderId: string,
  payload: { status: string; description?: string; location?: string },
) {
  const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/logistics/checkpoints`, payload);
  return response.data.data;
}

export async function cancelOrder(orderId: string, payload: { reason: string }) {
  const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`, payload);
  return response.data.data;
}

export async function applyAfterSale(
  orderId: string,
  payload: { type: 'refund' | 'return-refund' | 'exchange'; reason: string; description?: string; attachments?: string[] },
) {
  const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/after-sale`, payload);
  return response.data.data;
}

export async function updateAfterSale(
  orderId: string,
  payload: {
    status: 'processing' | 'resolved' | 'rejected';
    resolutionNote?: string;
    refund?: { amount: number; method: 'original' | 'wallet' | 'bank'; referenceId?: string; completedAt?: string };
  },
) {
  const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/after-sale`, payload);
  return response.data.data;
}


