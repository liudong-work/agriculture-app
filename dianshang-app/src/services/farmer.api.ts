import { apiClient } from './apiClient';
import type {
  CreateFarmerStoryEntryPayload,
  FarmerStoryResponse,
  UpdateFarmerStoryPayload,
} from '../types/farmer';

export async function fetchFarmerStory(farmerId: string) {
  const response = await apiClient.get<{ success: boolean; data: FarmerStoryResponse }>(
    `/farmers/${farmerId}/story`,
  );
  return response.data.data;
}

export async function updateFarmerStory(farmerId: string, payload: UpdateFarmerStoryPayload) {
  const response = await apiClient.put<{ success: boolean; data: FarmerStoryResponse['overview'] }>(
    `/farmers/${farmerId}/story`,
    payload,
  );
  return response.data.data;
}

export async function createFarmerStoryEntry(
  farmerId: string,
  payload: CreateFarmerStoryEntryPayload,
) {
  const response = await apiClient.post<{ success: boolean; data: FarmerStoryResponse['stories'][number] }>(
    `/farmers/${farmerId}/stories`,
    payload,
  );
  return response.data.data;
}
