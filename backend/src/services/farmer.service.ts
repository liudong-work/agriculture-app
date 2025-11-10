import { FarmerRepository } from '../repositories/farmer.repository';
import type {
  CreateFarmerStoryEntryPayload,
  FarmerStoryEntry,
  FarmerStoryOverview,
  UpdateFarmerStoryPayload,
} from '../types/farmer';

const farmerRepository = new FarmerRepository();

export class FarmerService {
  async getStoryOverview(farmerId: string): Promise<FarmerStoryOverview | null> {
    return farmerRepository.getStoryOverview(farmerId);
  }

  async updateStoryOverview(farmerId: string, payload: UpdateFarmerStoryPayload): Promise<FarmerStoryOverview> {
    return farmerRepository.updateStoryOverview(farmerId, payload);
  }

  async listStories(farmerId: string, limit?: number): Promise<FarmerStoryEntry[]> {
    return farmerRepository.listStoryEntries(farmerId, limit ?? 50);
  }

  async createStoryEntry(farmerId: string, payload: CreateFarmerStoryEntryPayload): Promise<FarmerStoryEntry> {
    return farmerRepository.createStoryEntry(farmerId, payload);
  }
}
