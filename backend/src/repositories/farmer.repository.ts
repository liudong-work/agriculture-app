import { prisma } from '../lib/prisma';
import type {
  CreateFarmerStoryEntryPayload,
  FarmerStoryEntry,
  FarmerStoryOverview,
  UpdateFarmerStoryPayload,
} from '../types/farmer';

function assignOptional<T extends Record<string, unknown>>(target: T, key: keyof T, value: unknown) {
  if (value !== undefined && value !== null) {
    // @ts-expect-error allow dynamic assignment with runtime guard
    target[key] = value;
  }
}

function mapOverview(record: any): FarmerStoryOverview {
  const overview: FarmerStoryOverview = {
    farmerId: record.id,
    farmName: record.farmName,
  };

  assignOptional(overview, 'heroImage', record.heroImage);
  assignOptional(overview, 'region', record.region);
  assignOptional(overview, 'storyHeadline', record.storyHeadline);
  assignOptional(overview, 'storyContent', record.storyContent);
  assignOptional(overview, 'storyHighlights', record.storyHighlights);
  assignOptional(overview, 'storyGallery', record.storyGallery as FarmerStoryOverview['storyGallery']);
  assignOptional(overview, 'certifications', record.certifications as FarmerStoryOverview['certifications']);

  return overview;
}

function mapStory(entry: any): FarmerStoryEntry {
  const result: FarmerStoryEntry = {
    id: entry.id,
    farmerId: entry.farmerId,
    title: entry.title,
    content: entry.content,
    labels: entry.labels ?? [],
    publishedAt: entry.publishedAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };

  if (entry.media) {
    result.media = entry.media;
  }

  return result;
}

export class FarmerRepository {
  async getStoryOverview(farmerId: string): Promise<FarmerStoryOverview | null> {
    const record = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      select: {
        id: true,
        farmName: true,
        heroImage: true,
        region: true,
        storyHeadline: true,
        storyContent: true,
        storyHighlights: true,
        storyGallery: true,
        certifications: true,
      },
    });

    if (!record) {
      return null;
    }

    return mapOverview(record);
  }

  async updateStoryOverview(farmerId: string, payload: UpdateFarmerStoryPayload): Promise<FarmerStoryOverview> {
    const data: Record<string, unknown> = {};

    if (payload.heroImage !== undefined) data.heroImage = payload.heroImage;
    if (payload.region !== undefined) data.region = payload.region;
    if (payload.storyHeadline !== undefined) data.storyHeadline = payload.storyHeadline;
    if (payload.storyContent !== undefined) data.storyContent = payload.storyContent;
    if (payload.storyHighlights !== undefined) data.storyHighlights = payload.storyHighlights;
    if (payload.storyGallery !== undefined) data.storyGallery = payload.storyGallery as any;
    if (payload.certifications !== undefined) data.certifications = payload.certifications as any;

    const updated = await prisma.farmerProfile.update({
      where: { id: farmerId },
      data,
    });

    return mapOverview(updated);
  }

  async listStoryEntries(farmerId: string, limit = 20): Promise<FarmerStoryEntry[]> {
    const entries = await prisma.farmerStory.findMany({
      where: { farmerId },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return entries.map(mapStory);
  }

  async createStoryEntry(farmerId: string, payload: CreateFarmerStoryEntryPayload): Promise<FarmerStoryEntry> {
    const data: any = {
      farmerId,
      title: payload.title,
      content: payload.content,
      labels: payload.labels ?? [],
    };

    if (payload.media !== undefined) {
      data.media = payload.media;
    }

    if (payload.publishedAt) {
      data.publishedAt = new Date(payload.publishedAt);
    }

    const record = await prisma.farmerStory.create({ data });

    return mapStory(record);
  }
}
