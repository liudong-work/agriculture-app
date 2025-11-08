import { apiClient } from './apiClient';
import type { Address, UpsertAddressPayload } from '../types/address';

type AddressListResponse = {
  success: boolean;
  data: Address[];
};

type AddressResponse = {
  success: boolean;
  data: Address;
};

export async function fetchAddresses() {
  const response = await apiClient.get<AddressListResponse>('/addresses');
  return response.data.data;
}

export async function createAddress(payload: UpsertAddressPayload) {
  const response = await apiClient.post<AddressResponse>('/addresses', payload);
  return response.data.data;
}

export async function updateAddress(addressId: string, payload: UpsertAddressPayload) {
  const response = await apiClient.put<AddressResponse>(`/addresses/${addressId}`, payload);
  return response.data.data;
}

export async function deleteAddress(addressId: string) {
  await apiClient.delete(`/addresses/${addressId}`);
}


