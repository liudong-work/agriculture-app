import { apiClient } from './apiClient';

type LoginPayload = {
  phone: string;
  password: string;
};

type RegisterPayload = {
  phone: string;
  password: string;
  name?: string;
};

type AuthResponse = {
  success: boolean;
  data: {
    user: {
      id: string;
      phone: string;
      name?: string;
      role: 'customer' | 'farmer' | 'admin';
    };
    accessToken: string;
  };
};

export async function loginApi(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data.data;
}

export async function registerApi(payload: RegisterPayload) {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data.data;
}

